import { Inject } from "@nestjs/common";
import { WebSocketGateway, OnGatewayConnection } from "@nestjs/websockets";
import type { WebSocket } from "ws";
import type { WsMessage } from "@termloop/shared";
import { TerminalService } from "./terminal.service.js";

@WebSocketGateway({ path: "/ws/terminal" })
export class TerminalGateway implements OnGatewayConnection {
  constructor(@Inject(TerminalService) private readonly terminal: TerminalService) {}

  handleConnection(client: WebSocket) {
    let channelId: string | null = null;
    // True only when this socket created the channel via openShell — only the owner tears
    // it down on disconnect. A socket that attached to someone else's session must not.
    let owns = false;

    const wireChannel = (connectionId: string, id: string) => {
      channelId = id;

      sendMessage(client, { type: "terminal:connected", connectionId, sessionId: id });

      this.terminal.onData(id, (data) => {
        sendMessage(client, { type: "terminal:output", connectionId, data });
      });

      this.terminal.onClose(id, () => {
        sendMessage(client, { type: "terminal:close", connectionId });
        channelId = null;
      });
    };

    client.on("message", async (raw: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString());

        switch (msg.type) {
          case "terminal:input": {
            if (channelId && msg.data) {
              this.terminal.write(channelId, msg.data);
            } else if (!channelId && msg.connectionId) {
              try {
                const opened = await this.terminal.openShell(msg.connectionId, {
                  cols: msg.cols || 80,
                  rows: msg.rows || 24,
                });
                owns = true;
                wireChannel(msg.connectionId, opened.channelId);

                if (msg.data) {
                  this.terminal.write(opened.channelId, msg.data);
                }
              } catch (err: unknown) {
                const error = err instanceof Error ? err.message : "SSH connection failed";
                sendMessage(client, {
                  type: "terminal:error",
                  connectionId: msg.connectionId,
                  error,
                });
              }
            }
            break;
          }

          case "terminal:attach": {
            if (!channelId && msg.connectionId) {
              const candidates = this.terminal.findChannelIds(msg.connectionId);
              const existing = msg.sessionId
                ? candidates.find((id) => id === msg.sessionId)
                : candidates[0];

              if (!existing) {
                sendMessage(client, {
                  type: "terminal:error",
                  connectionId: msg.connectionId,
                  error: "No active session",
                });
                break;
              }

              owns = false;
              wireChannel(msg.connectionId, existing);
            }
            break;
          }

          case "terminal:resize": {
            if (channelId && msg.cols && msg.rows) {
              this.terminal.resize(channelId, msg.cols, msg.rows);
            }
            break;
          }
        }
      } catch {
        // Invalid JSON, ignore
      }
    });

    client.on("close", () => {
      if (channelId && owns) {
        this.terminal.close(channelId);
      }
      channelId = null;
    });
  }
}

function sendMessage(ws: WebSocket, msg: WsMessage) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
