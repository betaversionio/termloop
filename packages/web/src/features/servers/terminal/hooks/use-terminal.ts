import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import type { ITheme } from '@xterm/xterm';
import type { WsMessage } from '@termloop/shared';
import { terminalThemesMap } from '../lib/terminal-themes';

interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  themeName: string;
}

function resolveTheme(name: string): ITheme {
  return (
    terminalThemesMap.get(name)?.theme ??
    terminalThemesMap.get('default-dark')!.theme
  );
}

export function useTerminal(connectionId: string, settings: TerminalSettings) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);

  const connect = useCallback(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: resolveTheme(settings.themeName),
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    setTimeout(() => fitAddon.fit(), 50);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const dims = { cols: term.cols, rows: term.rows };
      const msg: WsMessage = {
        type: 'terminal:input',
        connectionId,
        ...dims,
      };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);
      switch (msg.type) {
        case 'terminal:output':
          if (msg.data) term.write(msg.data);
          break;
        case 'terminal:connected':
          term.focus();
          break;
        case 'terminal:error':
          term.writeln(`\r\n\x1b[31mError: ${msg.error}\x1b[0m`);
          break;
        case 'terminal:close':
          term.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
          break;
      }
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[33mDisconnected.\x1b[0m');
    };

    // Terminal input -> WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        const msg: WsMessage = {
          type: 'terminal:input',
          connectionId,
          data,
        };
        ws.send(JSON.stringify(msg));
      }
    });

    // Resize handling
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        const msg: WsMessage = {
          type: 'terminal:resize',
          connectionId,
          cols,
          rows,
        };
        ws.send(JSON.stringify(msg));
      }
    });

    // Debounced fit to avoid resize loops; skip when container is hidden (minimized)
    let rafId = 0;
    const debouncedFit = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el || el.clientWidth < 10 || el.clientHeight < 10) return;
        fitAddon.fit();
      });
    };

    window.addEventListener('resize', debouncedFit);

    const resizeObserver = new ResizeObserver(debouncedFit);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', debouncedFit);
      resizeObserver.disconnect();
    };
  }, [connectionId]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      wsRef.current?.close();
      termRef.current?.dispose();
      initializedRef.current = false;
    };
  }, [connect]);

  // React to settings changes after initial mount
  useEffect(() => {
    const term = termRef.current;
    const fitAddon = fitAddonRef.current;
    if (!term || !fitAddon) return;

    term.options.fontSize = settings.fontSize;
    term.options.fontFamily = settings.fontFamily;
    term.options.theme = resolveTheme(settings.themeName);
    fitAddon.fit();
  }, [settings.fontSize, settings.fontFamily, settings.themeName]);

  return { containerRef, termRef, wsRef };
}
