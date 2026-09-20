import { useState, useCallback } from "react";

const STORAGE_KEY = "termloop:terminal-settings";

interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  themeName: string;
}

const defaults: TerminalSettings = {
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontSize: 14,
  themeName: "default-dark",
};

function load(): TerminalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function save(settings: TerminalSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useTerminalSettings() {
  const [settings, setSettings] = useState<TerminalSettings>(load);

  const update = useCallback(
    (patch: Partial<TerminalSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        save(next);
        return next;
      });
    },
    [],
  );

  const setFontFamily = useCallback(
    (fontFamily: string) => update({ fontFamily }),
    [update],
  );
  const setFontSize = useCallback(
    (fontSize: number) => update({ fontSize }),
    [update],
  );
  const setThemeName = useCallback(
    (themeName: string) => update({ themeName }),
    [update],
  );

  return { settings, setFontFamily, setFontSize, setThemeName };
}
