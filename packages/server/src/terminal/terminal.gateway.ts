import { Inject } from "@nestjs/common";
import { WebSocketGateway, OnGatewayConnection } from "@nestjs/websockets";
import type { WebSocket } from "ws";
import type { WsMessage } from "@stacklane/shared";
import { TerminalService } from "./terminal.service.js";

@WebSocketGateway({ path: "/ws/terminal" })
export class TerminalGateway implements OnGatewayConnection {
  constructor(@Inject(TerminalService) private readonly terminal: TerminalService) {}

  handleConnection(client: WebSocket) {
    let channelId: string | null = null;

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
                channelId = opened.channelId;

                sendMessage(client, {
                  type: "terminal:connected",
                  connectionId: msg.connectionId,
                });

                this.terminal.onData(channelId, (data) => {
                  sendMessage(client, {
                    type: "terminal:output",
                    connectionId: msg.connectionId,
                    data,
                  });
                });

                this.terminal.onClose(channelId, () => {
                  sendMessage(client, {
                    type: "terminal:close",
                    connectionId: msg.connectionId,
                  });
                  channelId = null;
                });

                if (msg.data) {
                  this.terminal.write(channelId, msg.data);
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
      if (channelId) {
        this.terminal.close(channelId);
        channelId = null;
      }
    });
  }
}

function sendMessage(ws: WebSocket, msg: WsMessage) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
