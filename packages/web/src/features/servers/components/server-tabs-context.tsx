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

export function useServerTabs() {
  const [ids, setIds] = useState(openIds);

  useEffect(() => {
    listeners.push(setIds);
    return () => {
      const index = listeners.indexOf(setIds);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { openIds: ids, openTab, closeTab };
}
