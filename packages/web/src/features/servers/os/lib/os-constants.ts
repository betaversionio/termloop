import type { AppType, BuiltInAppType, WindowBounds } from '../types/window';

export interface AppDefinition {
  type: AppType;
  title: string;
  icon: string;
  iconUrl: string;
  defaultSize: { width: number; height: number };
  minWidth: number;
  minHeight: number;
}

export const BUILTIN_REGISTRY: Record<BuiltInAppType, AppDefinition> = {
  'file-manager': {
    type: 'file-manager',
    title: 'Finder',
    icon: 'folder-open',
    iconUrl: '/app-icons/finder.png',
    defaultSize: { width: 900, height: 600 },
    minWidth: 500,
    minHeight: 350,
  },
  terminal: {
    type: 'terminal',
    title: 'Terminal',
    icon: 'terminal',
    iconUrl: '/app-icons/terminal.png',
    defaultSize: { width: 800, height: 500 },
    minWidth: 400,
    minHeight: 250,
  },
  monitor: {
    type: 'monitor',
    title: 'Activity Monitor',
    icon: 'monitor',
    iconUrl: '/app-icons/activity-monitor.svg',
    defaultSize: { width: 750, height: 550 },
    minWidth: 400,
    minHeight: 300,
  },
  notepad: {
    type: 'notepad',
    title: 'TextEdit',
    icon: 'document',
    iconUrl: '/app-icons/textedit.png',
    defaultSize: { width: 700, height: 500 },
    minWidth: 400,
    minHeight: 300,
  },
  settings: {
    type: 'settings',
    title: 'Settings',
    icon: 'settings',
    iconUrl: '/app-icons/settings.png',
    defaultSize: { width: 820, height: 620 },
    minWidth: 560,
    minHeight: 420,
  },
  browser: {
    type: 'browser',
    title: 'Browser',
    icon: 'globe',
    iconUrl: '/app-icons/browser.png',
    defaultSize: { width: 1000, height: 700 },
    minWidth: 500,
    minHeight: 400,
  },
  'app-store': {
    type: 'app-store',
    title: 'App Store',
    icon: 'store',
    iconUrl: '/app-icons/app-store.webp',
    defaultSize: { width: 960, height: 640 },
    minWidth: 700,
    minHeight: 480,
  },
  calculator: {
    type: 'calculator',
    title: 'Calculator',
    icon: 'calculator',
    iconUrl: '/app-icons/calculator.png',
    defaultSize: { width: 260, height: 460 },
    minWidth: 240,
    minHeight: 400,
  },
};

/** Mutable runtime registry — built-in apps + installed marketplace apps */
export const appRegistry = new Map<AppType, AppDefinition>(
  Object.entries(BUILTIN_REGISTRY) as [AppType, AppDefinition][],
);

// Empty by default — the Dock (and Launchpad) are the app launchers, matching real
// macOS where the Desktop itself doesn't carry built-in app icons. Marketplace apps
// can still opt into a desktop icon via their manifest's `showOnDesktop` flag.
export const BUILTIN_DESKTOP_APPS: BuiltInAppType[] = [];

export const BUILTIN_DOCK_APPS: BuiltInAppType[] = [
  'file-manager',
  'terminal',
  'browser',
  'monitor',
  'notepad',
  'settings',
  'app-store',
];

// Reserved space at the bottom of the screen for the dock (maximize bounds, desktop
// icon grid) — the dock itself sizes to its content via padding, not this value; this
// just needs to comfortably cover its natural height (~76px) plus its bottom margin.
export const GRID_CELL = 90; // desktop icon/widget snap grid size in px
// Visible gap between a widget's card and its neighbors/the screen edges — the
// widget's *footprint* (used for drag/snap math) can still touch a neighbor's,
// this is purely a visual inset on the rendered card within that footprint.
export const WIDGET_GAP = 14;
export const TASKBAR_HEIGHT = 100;
export const WINDOW_STAGGER = 30;
export const TITLE_BAR_HEIGHT = 36;
export const MENU_BAR_HEIGHT = 28;

export const SIDEBAR_SHORTCUTS = [
  { label: 'Root', path: '/' },
  { label: 'Home', path: '/home' },
  { label: 'tmp', path: '/tmp' },
  { label: 'etc', path: '/etc' },
  { label: 'var', path: '/var' },
  { label: 'opt', path: '/opt' },
  { label: 'usr', path: '/usr' },
  { label: 'srv', path: '/srv' },
];

const DEFAULT_APP_SIZE = { width: 700, height: 500 };
const DEFAULT_MIN_WIDTH = 400;
const DEFAULT_MIN_HEIGHT = 300;

export function getDefaultBounds(
  appType: AppType,
  _staggerIndex: number,
): WindowBounds {
  const def = appRegistry.get(appType);
  return {
    x: 100,
    // Below the menu bar (which sits at zIndex 9999, above every window) — otherwise a
    // window's own title bar (with its close/minimize/maximize controls) opens hidden
    // underneath it and is unreachable.
    y: MENU_BAR_HEIGHT + 12,
    width: def?.defaultSize.width ?? DEFAULT_APP_SIZE.width,
    height: def?.defaultSize.height ?? DEFAULT_APP_SIZE.height,
  };
}
