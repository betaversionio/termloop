import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { WindowState, WindowAction } from "../types/window";
import { appRegistry, getDefaultBounds, TASKBAR_HEIGHT, MENU_BAR_HEIGHT } from "../lib/os-constants";

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

const STORAGE_KEY = "termloop-window-state";

function loadState(): WindowManagerState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WindowManagerState;
      if (Array.isArray(parsed.windows)) return parsed;
    }
  } catch {}
  return emptyState;
}

function saveState(state: WindowManagerState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
                bounds: {
                  x: 0,
                  y: MENU_BAR_HEIGHT,
                  width: window.innerWidth,
                  height: window.innerHeight - TASKBAR_HEIGHT - MENU_BAR_HEIGHT,
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

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(windowReducer, undefined, loadState);

  // Persist state changes to sessionStorage (debounced)
  const rafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => saveState(state));
  }, [state]);

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
