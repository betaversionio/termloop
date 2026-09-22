import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { WindowState, WindowAction } from "../types/window";
import { appRegistry, getDefaultBounds } from "../lib/os-constants";

interface WindowManagerState {
  windows: WindowState[];
  nextZIndex: number;
  windowCounter: number;
}

const emptyState: WindowManagerState = {
  windows: [],
  nextZIndex: 10,
  windowCounter: 0,
};

const STORAGE_PREFIX = "termloop-window-state";

function storageKey(connectionId: string) {
  return `${STORAGE_PREFIX}:${connectionId}`;
}

function loadState(connectionId: string): WindowManagerState {
  try {
    const raw = localStorage.getItem(storageKey(connectionId));
    if (raw) {
      const parsed = JSON.parse(raw) as WindowManagerState;
      if (Array.isArray(parsed.windows)) return parsed;
    }
  } catch {}
  return emptyState;
}

function saveState(connectionId: string, state: WindowManagerState) {
  try {
    localStorage.setItem(storageKey(connectionId), JSON.stringify(state));
  } catch {}
}

function windowReducer(
  state: WindowManagerState,
  action: WindowAction
): WindowManagerState {
  switch (action.type) {
    case "OPEN": {
      const app = appRegistry.get(action.appType);
      const counter = state.windowCounter + 1;
      const bounds = getDefaultBounds(action.appType, counter % 10);
      const defaultTitle = app?.title ?? action.appType;
      const title = action.payload?.fileName
        ? `${defaultTitle} — ${action.payload.fileName as string}`
        : defaultTitle;
      const newWindow: WindowState = {
        id: `win-${counter}`,
        appType: action.appType,
        title,
        bounds,
        prevBounds: null,
        minimized: false,
        maximized: false,
        zIndex: state.nextZIndex,
        minWidth: app?.minWidth ?? 400,
        minHeight: app?.minHeight ?? 300,
        payload: action.payload,
      };
      return {
        windows: [...state.windows, newWindow],
        nextZIndex: state.nextZIndex + 1,
        windowCounter: counter,
      };
    }

    case "CLOSE":
      return {
        ...state,
        windows: state.windows.filter((w) => w.id !== action.id),
      };

    case "FOCUS":
      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? { ...w, zIndex: state.nextZIndex, minimized: false }
            : w
        ),
      };

    case "MINIMIZE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: true } : w
        ),
      };

    case "MAXIMIZE":
      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? {
                ...w,
                maximized: true,
                minimized: false,
                prevBounds: w.bounds,
                // True full screen — covers the whole viewport, same as real macOS. The
                // menu bar and dock hide themselves while a window is maximized and only
                // reveal on hover near their edge, rather than reserving permanent space.
                bounds: {
                  x: 0,
                  y: 0,
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
                zIndex: state.nextZIndex,
              }
            : w
        ),
      };

    case "RESTORE":
      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? {
                ...w,
                maximized: false,
                minimized: false,
                bounds: w.prevBounds ?? w.bounds,
                prevBounds: null,
                zIndex: state.nextZIndex,
              }
            : w
        ),
      };

    case "MOVE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? { ...w, bounds: { ...w.bounds, x: action.x, y: action.y } }
            : w
        ),
      };

    case "RESIZE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? { ...w, bounds: { ...w.bounds, ...action.bounds } }
            : w
        ),
      };

    case "RENAME":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, title: action.title } : w
        ),
      };

    default:
      return state;
  }
}

interface WindowManagerContextValue {
  state: WindowManagerState;
  dispatch: React.Dispatch<WindowAction>;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null
);

interface WindowManagerProviderProps {
  connectionId: string;
  children: ReactNode;
}

export function WindowManagerProvider({ connectionId, children }: WindowManagerProviderProps) {
  const [state, dispatch] = useReducer(windowReducer, connectionId, loadState);

  // Persist state changes to localStorage (debounced), scoped per server so open
  // windows survive a reload/relaunch and don't leak between different servers.
  const rafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => saveState(connectionId, state));
  }, [connectionId, state]);

  return (
    <WindowManagerContext.Provider value={{ state, dispatch }}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx)
    throw new Error("useWindowManager must be used within WindowManagerProvider");
  return ctx;
}
