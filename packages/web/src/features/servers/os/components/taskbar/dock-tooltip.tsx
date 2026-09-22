import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DockTooltipProps {
  label: string;
  hovered: boolean;
  anchorRef: RefObject<HTMLElement | null>;
}

/** Portaled to document.body — a backdrop-blur element nested inside another
 * backdrop-blur element fails to actually blur in Chromium/WebKit, so both the bubble
 * and its arrow have to be independent siblings here (not parent/child of each other),
 * each escaping the dock's own blurred DOM subtree to render correctly. */
export function DockTooltip({ label, hovered, anchorRef }: DockTooltipProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [bubbleRect, setBubbleRect] = useState<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (hovered && anchorRef.current) {
      setAnchorRect(anchorRef.current.getBoundingClientRect());
    }
  }, [hovered, anchorRef]);

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleRect(bubbleRef.current.getBoundingClientRect());
  }, [anchorRect, label]);

  if (!anchorRect) return null;

  return createPortal(
    <>
      <div
        ref={bubbleRef}
        className={cn(
          "fixed z-[10000] -translate-x-1/2 px-[13px] py-[5px] rounded-full text-[12.5px] font-medium text-white whitespace-nowrap pointer-events-none transition-opacity duration-100",
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.05)_100%),rgba(30,30,30,0.6)]",
          "backdrop-blur-[40px] backdrop-saturate-[2.2]",
          "shadow-[0_0_0_0.5px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.15)]",
          hovered ? "opacity-100" : "opacity-0"
        )}
        style={{ left: anchorRect.left + anchorRect.width / 2, top: anchorRect.top - 58 }}
      >
        {label}
      </div>

      {/* Downward-pointing arrow — a sibling of the bubble (not nested inside it), so
          its own backdrop-blur isn't broken by the bubble's. Tucked half under the
          bubble's bottom edge so it reads as one continuous speech-bubble shape. */}
      {bubbleRect && (
        <div
          className={cn(
            "fixed z-[10000] -translate-x-1/2 rotate-45 w-2 h-2 rounded-br-[2px] pointer-events-none transition-opacity duration-100",
            "bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.14)_100%),rgba(30,30,30,0.6)]",
            "backdrop-blur-[40px] backdrop-saturate-[2.2]",
            "shadow-[1px_1px_0_0.5px_rgba(255,255,255,0.2)]",
            hovered ? "opacity-100" : "opacity-0"
          )}
          style={{ left: bubbleRect.left + bubbleRect.width / 2, top: bubbleRect.bottom - 4 }}
        />
      )}
    </>,
    document.body
  );
}
