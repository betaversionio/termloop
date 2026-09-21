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
    iconUrl: '/app-icons/textedit.svg',
    defaultSize: { width: 700, height: 500 },
    minWidth: 400,
    minHeight: 300,
  },
  settings: {
    type: 'settings',
    title: 'Settings',
    icon: 'settings',
    iconUrl: '/app-icons/settings.png',
    defaultSize: { width: 650, height: 550 },
    minWidth: 450,
    minHeight: 400,
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
    defaultSize: { width: 800, height: 600 },
    minWidth: 500,
    minHeight: 400,
  },
};

/** Mutable runtime registry — built-in apps + installed marketplace apps */
export const appRegistry = new Map<AppType, AppDefinition>(
  Object.entries(BUILTIN_REGISTRY) as [AppType, AppDefinition][],
);

export const BUILTIN_DESKTOP_APPS: BuiltInAppType[] = [
  'file-manager',
  'terminal',
  'monitor',
  'settings',
  'browser',
];

export const BUILTIN_DOCK_APPS: BuiltInAppType[] = [
  'file-manager',
  'terminal',
  'browser',
  'monitor',
  'notepad',
  'settings',
  'app-store',
];

export const TASKBAR_HEIGHT = 78;
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
    y: 0,
    width: def?.defaultSize.width ?? DEFAULT_APP_SIZE.width,
    height: def?.defaultSize.height ?? DEFAULT_APP_SIZE.height,
  };
}
