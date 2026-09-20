import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface IconPosition {
  x: number;
  y: number;
}

interface DesktopSettingsContext {
  wallpaper: string;
  setWallpaper: (id: string) => void;
  iconPositions: Record<string, IconPosition>;
  setIconPosition: (appType: string, pos: IconPosition) => void;
}

const DesktopSettingsContext = createContext<DesktopSettingsContext>({
  wallpaper: "image-betaversion",
  setWallpaper: () => {},
  iconPositions: {},
  setIconPosition: () => {},
});

const STORAGE_KEY = "termloop-desktop-settings";

interface StoredSettings {
  wallpaper?: string;
  iconPositions?: Record<string, IconPosition>;
}

function loadSettings(): StoredSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveSettings(settings: StoredSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function DesktopSettingsProvider({ children }: { children: ReactNode }) {
  const [wallpaper, setWallpaperState] = useState<string>(
    () => loadSettings().wallpaper || "image-betaversion"
  );

  const [iconPositions, setIconPositions] = useState<Record<string, IconPosition>>(
    () => loadSettings().iconPositions || {}
  );

  const setWallpaper = useCallback((id: string) => {
    setWallpaperState(id);
    setIconPositions((prev) => {
      saveSettings({ wallpaper: id, iconPositions: prev });
      return prev;
    });
  }, []);

  const setIconPosition = useCallback((appType: string, pos: IconPosition) => {
    setIconPositions((prev) => {
      const next = { ...prev, [appType]: pos };
      setWallpaperState((wp) => {
        saveSettings({ wallpaper: wp, iconPositions: next });
        return wp;
      });
      return next;
    });
  }, []);

  return (
    <DesktopSettingsContext value={{ wallpaper, setWallpaper, iconPositions, setIconPosition }}>
      {children}
    </DesktopSettingsContext>
  );
}

export const useDesktopSettings = () => useContext(DesktopSettingsContext);
