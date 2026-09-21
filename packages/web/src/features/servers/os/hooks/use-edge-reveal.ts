import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the menu bar/dock should be shown while a window is in true full screen,
 * matching real macOS's hover-to-reveal behavior. Returns false (never reveals) while
 * `active` is false.
 *
 * Two zones: a thin `triggerPx` strip at the very edge that reveals it, and a much larger
 * `keepVisiblePx` zone (covering the bar/dock's own on-screen size) that keeps it visible
 * once shown — otherwise moving the mouse up onto the dock itself to click an icon would
 * immediately leave the trigger strip and hide it again. A short `hideDelayMs` grace period
 * before actually hiding avoids flicker when moving across the gap between the two zones.
 */
export function useEdgeReveal(
  edge: "top" | "bottom",
  active: boolean,
  triggerPx = 6,
  keepVisiblePx = 90,
  hideDelayMs = 350
): boolean {
  const [revealed, setRevealed] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!active) {
      setRevealed(false);
      clearTimeout(hideTimer.current);
      return;
    }

    const onMove = (e: MouseEvent) => {
      const y = e.clientY;
      const inZone =
        edge === "top"
          ? y <= Math.max(triggerPx, keepVisiblePx)
          : y >= window.innerHeight - Math.max(triggerPx, keepVisiblePx);

      clearTimeout(hideTimer.current);
      if (inZone) {
        setRevealed(true);
      } else {
        hideTimer.current = setTimeout(() => setRevealed(false), hideDelayMs);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(hideTimer.current);
    };
  }, [active, edge, triggerPx, keepVisiblePx, hideDelayMs]);

  return revealed;
}
