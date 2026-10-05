import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import type { ITheme } from "@xterm/xterm";
import type { WsMessage } from "@termloop/shared";
import { terminalThemesMap } from "./terminal-themes";

interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  themeName: string;
}

export interface EmbeddedTerminalSession {
  term: Terminal;
  ws: WebSocket;
  fitAddon: FitAddon;
  container: HTMLDivElement;
  opened: boolean;
  intentionallyClosed: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  connectionId: string;
  /** The backend channel this session is bound to, once known (from the first
   * terminal:connected message). Reconnects always target this exact channel via
   * `terminal:attach {sessionId}` — never the ambiguous "first session for this
   * connection" form the main Terminal app uses — so an embedded session never attaches
   * to the user's own Terminal app, or another embedded instance, for the same connection. */
  sessionId: string | null;
  initialCommand?: string;
  /** Guards against re-sending `initialCommand` on a reconnect to the same still-running
   * channel — only a genuinely fresh channel (the old one expired) should re-run it. */
  initialCommandSent: boolean;
}

function resolveTheme(name: string): ITheme {
  return (
    terminalThemesMap.get(name)?.theme ??
    terminalThemesMap.get("default-dark")!.theme
  );
}

/**
 * Live embedded-terminal sessions, keyed by a caller-supplied key (typically a marketplace
 * app's windowId) — a parallel pool to terminal-session-manager.ts's connectionId-keyed
 * sessions, so a marketplace app embedding a terminal (e.g. a 5250 emulator) never competes
 * for the same backend channel as the user's own Terminal app on the same connection.
 */
const sessions = new Map<string, EmbeddedTerminalSession>();

function connectSocket(session: EmbeddedTerminalSession, isReconnect: boolean) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws/terminal`);
  session.ws = ws;

  let attachFailed = false;

  ws.onopen = () => {
    session.reconnectAttempts = 0;
    if (session.sessionId) {
      const msg: WsMessage = {
        type: "terminal:attach",
        connectionId: session.connectionId,
        sessionId: session.sessionId,
      };
      ws.send(JSON.stringify(msg));
    } else {
      // No channel yet — skip straight to creating one. A connectionId-only
      // terminal:input (no prior attach) opens a brand-new shell server-side.
      const msg: WsMessage = {
        type: "terminal:input",
        connectionId: session.connectionId,
        cols: session.term.cols,
        rows: session.term.rows,
      };
      ws.send(JSON.stringify(msg));
    }
    if (isReconnect) session.term.writeln("\r\n\x1b[32mReconnected.\x1b[0m");
  };

  ws.onmessage = (event) => {
    const msg: WsMessage = JSON.parse(event.data);
    switch (msg.type) {
      case "terminal:output":
        if (msg.data) session.term.write(msg.data);
        break;
      case "terminal:connected":
        session.sessionId = msg.sessionId ?? session.sessionId;
        session.term.focus();
        if (session.initialCommand && !session.initialCommandSent) {
          session.initialCommandSent = true;
          const runMsg: WsMessage = {
            type: "terminal:input",
            connectionId: session.connectionId,
            data: session.initialCommand + "\r",
          };
          ws.send(JSON.stringify(runMsg));
        }
        break;
      case "terminal:error":
        if (!attachFailed) {
          attachFailed = true;
          // The channel we tried to resume is gone — create a fresh one, and let
          // initialCommand run again since whatever was running in it is gone too.
          session.sessionId = null;
          session.initialCommandSent = false;
          const dims = { cols: session.term.cols, rows: session.term.rows };
          const openMsg: WsMessage = { type: "terminal:input", connectionId: session.connectionId, ...dims };
          ws.send(JSON.stringify(openMsg));
        } else {
          session.term.writeln(`\r\n\x1b[31mError: ${msg.error}\x1b[0m`);
        }
        break;
      case "terminal:close":
        session.term.writeln("\r\n\x1b[33mConnection closed.\x1b[0m");
        break;
    }
  };

  ws.onclose = () => {
    if (session.intentionallyClosed) return;
    session.term.writeln("\r\n\x1b[33mDisconnected — reconnecting…\x1b[0m");
    scheduleReconnect(session);
  };
}

function scheduleReconnect(session: EmbeddedTerminalSession) {
  if (session.reconnectTimer) return;
  session.reconnectAttempts += 1;
  const delay = Math.min(1000 * 2 ** (session.reconnectAttempts - 1), 10000);
  session.reconnectTimer = setTimeout(() => {
    session.reconnectTimer = null;
    connectSocket(session, true);
  }, delay);
}

export function getOrCreateEmbeddedSession(
  key: string,
  connectionId: string,
  settings: TerminalSettings,
  initialCommand?: string
): EmbeddedTerminalSession {
  const existing = sessions.get(key);
  if (existing) return existing;

  const term = new Terminal({
    cursorBlink: true,
    fontSize: settings.fontSize,
    fontFamily: settings.fontFamily,
    theme: resolveTheme(settings.themeName),
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon());

  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";

  const session: EmbeddedTerminalSession = {
    term,
    ws: null as unknown as WebSocket, // set synchronously by connectSocket() below
    fitAddon,
    container,
    opened: false,
    intentionallyClosed: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
    connectionId,
    sessionId: null,
    initialCommand,
    initialCommandSent: false,
  };

  term.onData((data) => {
    if (session.ws.readyState === WebSocket.OPEN) {
      const msg: WsMessage = { type: "terminal:input", connectionId, data };
      session.ws.send(JSON.stringify(msg));
    }
  });

  term.onResize(({ cols, rows }) => {
    if (session.ws.readyState === WebSocket.OPEN) {
      const msg: WsMessage = { type: "terminal:resize", connectionId, cols, rows };
      session.ws.send(JSON.stringify(msg));
    }
  });

  connectSocket(session, false);

  sessions.set(key, session);
  return session;
}

/** Same move-not-clone attach pattern as terminal-session-manager.ts's attachSession. */
export function attachEmbeddedSession(session: EmbeddedTerminalSession, host: HTMLElement) {
  if (session.container.parentElement !== host) {
    host.replaceChildren(session.container);
  }
  if (!session.opened) {
    session.term.open(session.container);
    session.opened = true;
  }
}

/** Ends an embedded session for real — unlike the main Terminal app's sessions (which
 * outlive navigation), an embedded session belongs to one specific window, so it's closed
 * when that window unmounts rather than left running indefinitely in the background. */
export function closeEmbeddedSession(key: string) {
  const session = sessions.get(key);
  if (!session) return;
  session.intentionallyClosed = true;
  if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
  session.ws.close();
  session.term.dispose();
  session.container.remove();
  sessions.delete(key);
}
