import { useEffect, useRef } from 'react';
import { getOrCreateSession, attachSession, applySettings } from '../lib/terminal-session-manager';

interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  themeName: string;
}

export function useTerminal(connectionId: string, settings: TerminalSettings) {
  const containerRef = useRef<HTMLDivElement>(null);
  const session = getOrCreateSession(connectionId, settings);

  // Kept as stable ref objects (mutated in place) rather than fresh literals so consumers'
  // own useCallback/useMemo dependency arrays don't churn every render.
  const termRef = useRef(session.term);
  const wsRef = useRef(session.ws);
  termRef.current = session.term;
  wsRef.current = session.ws;

  useEffect(() => {
    if (!containerRef.current) return;

    // Moves the session's terminal into this container — a no-op if it's already there,
    // and how a session picks back up after the UI showing it was unmounted/re-mounted.
    attachSession(session, containerRef.current);
    setTimeout(() => session.fitAddon.fit(), 50);

    let rafId = 0;
    const debouncedFit = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el || el.clientWidth < 10 || el.clientHeight < 10) return;
        session.fitAddon.fit();
      });
    };

    window.addEventListener('resize', debouncedFit);
    const resizeObserver = new ResizeObserver(debouncedFit);
    resizeObserver.observe(containerRef.current);

    // Intentionally does not close the WebSocket or dispose the terminal on unmount — the
    // session lives on in terminal-session-manager until its tab is explicitly closed, so
    // navigating away (even outside the server workspace entirely) doesn't drop the connection.
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', debouncedFit);
      resizeObserver.disconnect();
    };
  }, [connectionId, session]);

  useEffect(() => {
    applySettings(connectionId, settings);
  }, [connectionId, settings.fontSize, settings.fontFamily, settings.themeName]);

  return { containerRef, termRef, wsRef };
}
