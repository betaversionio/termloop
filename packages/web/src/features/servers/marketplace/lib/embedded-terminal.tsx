import { useEffect, useRef } from "react";
import {
  getOrCreateEmbeddedSession,
  attachEmbeddedSession,
  closeEmbeddedSession,
} from "@/features/servers/terminal/lib/embedded-terminal-session";
import { useTerminalSettings } from "@/features/servers/terminal/hooks/use-terminal-settings";

interface EmbeddedTerminalProps {
  connectionId: string;
  initialCommand?: string;
  windowId?: string;
  className?: string;
}

let anonymousKeyCounter = 0;

/** Exposed to marketplace apps as `sdk.ui.Terminal`. A real, live PTY session rendered
 * with the host's own xterm.js — the same machinery the built-in Terminal app uses, just
 * keyed by `windowId` (a separate session pool) instead of by connectionId, so it never
 * competes with the user's own Terminal app or another embedded instance for the same
 * connection. Reuses the user's own font/theme terminal settings for visual consistency. */
export function EmbeddedTerminal({ connectionId, initialCommand, windowId, className }: EmbeddedTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useTerminalSettings();
  // Falls back to a generated key only if windowId is ever omitted — in practice every
  // marketplace app instance has one, since it's handed the same windowId as useWindow().
  const keyRef = useRef(windowId ?? `embedded-${++anonymousKeyCounter}`);
  const key = keyRef.current;

  const session = getOrCreateEmbeddedSession(key, connectionId, settings, initialCommand);

  useEffect(() => {
    if (!containerRef.current) return;
    attachEmbeddedSession(session, containerRef.current);
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

    window.addEventListener("resize", debouncedFit);
    const resizeObserver = new ResizeObserver(debouncedFit);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", debouncedFit);
      resizeObserver.disconnect();
    };
  }, [session]);

  // Unlike the main Terminal app's session, this one belongs to a single marketplace app
  // window — actually tear it down (closing the SSH channel) when that window unmounts,
  // instead of leaking a channel for every embedded terminal ever opened.
  useEffect(() => {
    return () => {
      closeEmbeddedSession(key);
    };
  }, [key]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
