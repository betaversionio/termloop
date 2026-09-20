import { useRef, useState, useCallback } from 'react';
import { useTerminal } from '../hooks/use-terminal';
import { useTerminalSettings } from '../hooks/use-terminal-settings';
import { useAppsSheet } from '../hooks/use-apps-sheet';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { AppsSheet } from './apps-sheet';
import { AppearanceSheet } from './appearance-sheet';
import { TerminalToolbar } from './terminal-toolbar';
import type { InstallableApp } from '../lib/app-catalog.types';
import { resolveInstallScript } from '../lib/resolve-install-script';
import type { WsMessage } from '@termloop/shared';
import { terminalThemesMap } from '../lib/terminal-themes';
import { cn } from '@/lib/utils';

interface TerminalPageProps {
  connectionId: string;
}

export function TerminalPage({ connectionId }: TerminalPageProps) {
  const { settings, setFontFamily, setFontSize, setThemeName } =
    useTerminalSettings();
  const { containerRef, wsRef } = useTerminal(connectionId, settings);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(wrapperRef);
  const [panelOpen, setPanelOpen] = useState(false);
  const appsSheet = useAppsSheet();

  const handleInstall = useCallback(
    (app: InstallableApp, values: Record<string, string>) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const script = resolveInstallScript(app, values);
      const msg: WsMessage = {
        type: 'terminal:input',
        connectionId,
        data: script + '\n',
      };
      ws.send(JSON.stringify(msg));
    },
    [connectionId, wsRef],
  );

  const activeTheme = terminalThemesMap.get(settings.themeName);
  const bgColor = activeTheme?.theme.background ?? '#09090b';
  const fgColor = activeTheme?.theme.foreground ?? '#fff';

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col h-full min-h-[400px]"
      style={isFullscreen ? { background: bgColor } : undefined}
    >
      {/* Toolbar */}
      <header
        className={cn(
          `flex items-center justify-between px-3 py-1.5 shrink-0 `,
          isFullscreen ? '' : 'rounded-t-lg',
        )}
        style={{ background: bgColor }}
      >
        <div />
        <TerminalToolbar
          fgColor={fgColor}
          bgColor={bgColor}
          isFullscreen={isFullscreen}
          onAppsClick={() => {
            setPanelOpen(false);
            appsSheet.setOpen(true);
          }}
          onAppearanceClick={() => setPanelOpen((v) => !v)}
          onFullscreenToggle={toggleFullscreen}
        />
      </header>

      {/* Terminal */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden p-2"
        style={{ background: bgColor }}
      />

      {/* Appearance Sheet */}
      <AppearanceSheet
        open={panelOpen}
        onOpenChange={setPanelOpen}
        container={wrapperRef.current}
        settings={settings}
        onFontFamilyChange={setFontFamily}
        onFontSizeChange={setFontSize}
        onThemeNameChange={setThemeName}
      />

      {/* Apps Sheet */}
      <AppsSheet
        state={appsSheet}
        onInstall={handleInstall}
        container={wrapperRef.current}
      />
    </div>
  );
}
