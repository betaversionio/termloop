import { useEffect, useState } from "react";
import { closeSession } from "@/features/servers/terminal/lib/terminal-session-manager";

/**
 * Open server tabs — module-level state (not React context) so it survives regardless of
 * which top-level route is mounted, e.g. navigating to the Dashboard and back doesn't lose
 * your open tabs, matching the terminal sessions themselves (terminal-session-manager.ts),
 * which persist the same way.
 */
let openIds: string[] = [];
const listeners: Array<(ids: string[]) => void> = [];

function emit() {
  listeners.forEach((listener) => listener(openIds));
}

export function openTab(id: string) {
  if (!openIds.includes(id)) {
    openIds = [...openIds, id];
    emit();
  }
}

export function closeTab(id: string) {
  openIds = openIds.filter((tabId) => tabId !== id);
  emit();
  closeSession(id);
}

/** Moves the tab at `fromId` to sit right before/after `toId` (drag-to-reorder). */
export function reorderTabs(fromId: string, toId: string) {
  if (fromId === toId) return;
  const from = openIds.indexOf(fromId);
  const to = openIds.indexOf(toId);
  if (from === -1 || to === -1) return;

  const next = [...openIds];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  openIds = next;
  emit();
}

export function useServerTabs() {
  const [ids, setIds] = useState(openIds);

  useEffect(() => {
    listeners.push(setIds);
    return () => {
      const index = listeners.indexOf(setIds);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { openIds: ids, openTab, closeTab, reorderTabs };
}
