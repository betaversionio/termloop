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

export interface TerminalSession {
  term: Terminal;
  /** Mutable — reconnection swaps this out for a fresh socket. Always read this, never
   * close over the WebSocket instance from when a session/connection was created, or a
   * reconnect would leave term.onData/onResize still talking to the dead socket. */
  ws: WebSocket;
  fitAddon: FitAddon;
  /**
   * A dedicated element xterm is opened into exactly once, for this session's lifetime.
   * A React host attaches by appendChild-ing this into its own wrapper (a real DOM move,
   * not a clone) rather than ever calling term.open() again — xterm doesn't support being
   * re-opened into a different container, so reusing one shared container across different
   * sessions (as switching tabs would, since the hosting component isn't remounted) left
   * stale terminal DOM behind instead of actually swapping.
   */
  container: HTMLDivElement;
  /** Whether term.open(container) has run yet — deferred until the first real attach. */
  opened: boolean;
  /** Set right before an explicit closeSession() — tells the socket's onclose not to reconnect. */
  intentionallyClosed: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

function resolveTheme(name: string): ITheme {
  return (
    terminalThemesMap.get(name)?.theme ??
    terminalThemesMap.get("default-dark")!.theme
  );
}

/**
 * Live terminal sessions, keyed by connectionId — module-level (not React state) so a
 * session survives regardless of which page/route is currently mounted, including
 * navigating clear away from the server workspace. A UI component "attaches" to a session
 * via attachSession(); detaching (unmounting) never disposes the session — only
 * closeSession() (an explicit tab close) does. The underlying WebSocket can still die on
 * its own (network blip, laptop sleep, backend restart) — connectSocket()'s onclose handler
 * auto-reconnects with backoff unless the session was explicitly closed.
 */
const sessions = new Map<string, TerminalSession>();

function connectSocket(session: TerminalSession, connectionId: string, isReconnect: boolean) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws/terminal`);
  session.ws = ws;

  let attachFailed = false;

  ws.onopen = () => {
    session.reconnectAttempts = 0;
    const msg: WsMessage = { type: "terminal:attach", connectionId };
    ws.send(JSON.stringify(msg));
    if (isReconnect) session.term.writeln("\r\n\x1b[32mReconnected.\x1b[0m");
  };

  ws.onmessage = (event) => {
    const msg: WsMessage = JSON.parse(event.data);
    switch (msg.type) {
      case "terminal:output":
        if (msg.data) session.term.write(msg.data);
        break;
      case "terminal:connected":
        session.term.focus();
        break;
      case "terminal:error":
        if (!attachFailed) {
          attachFailed = true;
          const dims = { cols: session.term.cols, rows: session.term.rows };
          const openMsg: WsMessage = { type: "terminal:input", connectionId, ...dims };
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
    scheduleReconnect(session, connectionId);
  };
}

function scheduleReconnect(session: TerminalSession, connectionId: string) {
  if (session.reconnectTimer) return;
  session.reconnectAttempts += 1;
  // Exponential backoff, capped at 10s, so a genuinely offline server doesn't spam retries.
  const delay = Math.min(1000 * 2 ** (session.reconnectAttempts - 1), 10000);
  session.reconnectTimer = setTimeout(() => {
    session.reconnectTimer = null;
    connectSocket(session, connectionId, true);
  }, delay);
}

export function getOrCreateSession(connectionId: string, settings: TerminalSettings): TerminalSession {
  const existing = sessions.get(connectionId);
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

  // Not opened yet — xterm needs the container to actually be visible/sized in the live
  // document when open() runs, which it isn't until a React host attaches it (see attachSession).
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";

  const session: TerminalSession = {
    term,
    ws: null as unknown as WebSocket, // set synchronously by connectSocket() below
    fitAddon,
    container,
    opened: false,
    intentionallyClosed: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
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

  connectSocket(session, connectionId, false);

  sessions.set(connectionId, session);
  return session;
}

/**
 * Moves a session's terminal into `host` (a real DOM move, not a clone), opening xterm into
 * it on the very first attach and just re-parenting on every attach after that. `host` is
 * reused across tab switches (the hosting React component isn't remounted), so any other
 * session still sitting in it from a previous tab is cleared out first — otherwise sessions
 * would stack up inside `host` instead of one replacing the other.
 */
export function attachSession(session: TerminalSession, host: HTMLElement) {
  if (session.container.parentElement !== host) {
    host.replaceChildren(session.container);
  }
  if (!session.opened) {
    session.term.open(session.container);
    session.opened = true;
  }
}

export function applySettings(connectionId: string, settings: TerminalSettings) {
  const session = sessions.get(connectionId);
  if (!session) return;
  session.term.options.fontSize = settings.fontSize;
  session.term.options.fontFamily = settings.fontFamily;
  session.term.options.theme = resolveTheme(settings.themeName);
  session.fitAddon.fit();
}

/** Explicitly ends a session (e.g. the user closed its tab) — closes the WS and disposes xterm. */
export function closeSession(connectionId: string) {
  const session = sessions.get(connectionId);
  if (!session) return;
  session.intentionallyClosed = true;
  if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
  session.ws.close();
  session.term.dispose();
  session.container.remove();
  sessions.delete(connectionId);
}

export function hasSession(connectionId: string): boolean {
  return sessions.has(connectionId);
}
