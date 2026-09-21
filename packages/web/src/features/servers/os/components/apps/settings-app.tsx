import { useState, useCallback } from 'react';
import { Sun, Moon, Monitor, Check, Info, Palette, SquareTerminal, Minus, Plus } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useDesktopSettings } from '../../context/desktop-settings-context';
import { WALLPAPERS, type WallpaperOption } from '../../lib/wallpapers';
import {
  terminalThemes,
  fontFamilyOptions,
  fontSizeOptions,
} from '@/features/servers/terminal/lib/terminal-themes';
import { useTerminalSettings } from '@/features/servers/terminal/hooks/use-terminal-settings';
import { ThemePreview } from '@/features/servers/terminal/components/theme-preview';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Category = 'general' | 'appearance' | 'terminal';

const CATEGORIES: { key: Category; label: string; icon: typeof Info; color: string }[] = [
  { key: 'general', label: 'General', icon: Info, color: '#8E8E93' },
  { key: 'appearance', label: 'Appearance', icon: Palette, color: '#0A84FF' },
  { key: 'terminal', label: 'Terminal', icon: SquareTerminal, color: '#1C1C1E' },
];

const themeModes = [
  { key: 'light' as const, label: 'Light', icon: Sun },
  { key: 'dark' as const, label: 'Dark', icon: Moon },
  { key: 'system' as const, label: 'System', icon: Monitor },
];

function WallpaperThumbnail({
  wp,
  active,
  onClick,
}: {
  wp: WallpaperOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn('relative flex flex-col items-center gap-1.5 group')}
    >
      <div
        className={cn(
          'relative w-[120px] h-[80px] rounded-lg overflow-hidden border-2 transition-all',
          active
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-border hover:border-muted-foreground/50',
        )}
      >
        {wp.type === 'gradient' ? (
          <div className={cn('absolute inset-0', wp.value)} />
        ) : (
          <div
            className="absolute inset-0 bg-center"
            style={{
              backgroundImage: wp.value.startsWith('url(') ? wp.value : `url(${wp.value})`,
              backgroundSize: wp.value.startsWith('url("data:') ? 'auto' : 'cover',
            }}
          />
        )}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Check className="h-5 w-5 text-white drop-shadow" />
          </div>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
        {wp.label}
      </span>
    </button>
  );
}

function GeneralSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">About</h2>
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">TermLoop</p>
          <p className="text-sm text-muted-foreground">
            A browser-based, OS-like interface for managing remote servers,
            cloud storage, and infrastructure — all from a single dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Version</p>
            <p className="font-medium">{__APP_VERSION__}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Author</p>
            <p className="font-medium">Satyam Lohiya</p>
          </div>
          <div>
            <p className="text-muted-foreground">License</p>
            <p className="font-medium">MIT</p>
          </div>
          <div>
            <p className="text-muted-foreground">Runtime</p>
            <p className="font-medium">Node.js + React</p>
          </div>
        </div>

        <div className="flex gap-4 pt-1 text-sm">
          <a
            href="https://github.com/betaversionio/termloop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/termloop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            npm
          </a>
          <a
            href="https://github.com/betaversionio/termloop/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Report an Issue
          </a>
        </div>
      </div>
    </section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { wallpaper, setWallpaper } = useDesktopSettings();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Theme</h2>
        <div className="flex gap-3">
          {themeModes.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 w-28 transition-all',
                theme === t.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
              )}
            >
              <div className="relative">
                <t.icon className="h-6 w-6 text-foreground" />
                {theme === t.key && (
                  <Check className="absolute -right-2 -top-2 h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1">Desktop Background</h2>

        <h3 className="text-xs text-muted-foreground mt-4 mb-2">Gradients</h3>
        <div className="flex flex-wrap gap-3">
          {WALLPAPERS.filter((w) => w.type === 'gradient').map((wp) => (
            <WallpaperThumbnail
              key={wp.id}
              wp={wp}
              active={wallpaper === wp.id}
              onClick={() => setWallpaper(wp.id)}
            />
          ))}
        </div>

        <h3 className="text-xs text-muted-foreground mt-4 mb-2">Patterns</h3>
        <div className="flex flex-wrap gap-3">
          {WALLPAPERS.filter(
            (w) => w.type === 'image' && w.id.startsWith('image-'),
          ).map((wp) => (
            <WallpaperThumbnail
              key={wp.id}
              wp={wp}
              active={wallpaper === wp.id}
              onClick={() => setWallpaper(wp.id)}
            />
          ))}
        </div>

        <h3 className="text-xs text-muted-foreground mt-4 mb-2">Photos</h3>
        <div className="flex flex-wrap gap-3">
          {WALLPAPERS.filter(
            (w) => w.type === 'image' && w.id.startsWith('photo-'),
          ).map((wp) => (
            <WallpaperThumbnail
              key={wp.id}
              wp={wp}
              active={wallpaper === wp.id}
              onClick={() => setWallpaper(wp.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TerminalSection() {
  const { settings, setFontFamily, setFontSize, setThemeName } = useTerminalSettings();

  const decrementSize = useCallback(() => {
    const idx = fontSizeOptions.indexOf(settings.fontSize);
    if (idx > 0) setFontSize(fontSizeOptions[idx - 1]);
  }, [settings.fontSize, setFontSize]);

  const incrementSize = useCallback(() => {
    const idx = fontSizeOptions.indexOf(settings.fontSize);
    if (idx < fontSizeOptions.length - 1) setFontSize(fontSizeOptions[idx + 1]);
  }, [settings.fontSize, setFontSize]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Font</h2>
        <div className="rounded-lg border border-border p-4 space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <span className="text-sm text-muted-foreground">Font Family</span>
            <Select value={settings.fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilyOptions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Text Size</span>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-r-none"
                onClick={decrementSize}
                disabled={settings.fontSize <= fontSizeOptions[0]}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <div className="flex h-7 w-10 items-center justify-center border-y border-input text-sm">
                {settings.fontSize}
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-l-none"
                onClick={incrementSize}
                disabled={settings.fontSize >= fontSizeOptions[fontSizeOptions.length - 1]}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Color Theme</h2>
        <div className="grid grid-cols-2 gap-2 max-w-2xl">
          {terminalThemes.map((t) => {
            const isActive = t.id === settings.themeName;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeName(t.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border-2 p-2.5 text-left transition-all',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                )}
              >
                <ThemePreview theme={t} />
                <span className={cn('text-sm', isActive ? 'text-primary font-medium' : 'text-foreground')}>
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function SettingsApp() {
  const [category, setCategory] = useState<Category>('general');

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar */}
      <nav className="w-[200px] shrink-0 border-r border-border bg-muted/30 py-3 px-2 space-y-0.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors text-left',
              category === c.key
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted',
            )}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]"
              style={{ backgroundColor: c.color }}
            >
              <c.icon className="h-3.5 w-3.5 text-white" />
            </span>
            {c.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {category === 'general' && <GeneralSection />}
        {category === 'appearance' && <AppearanceSection />}
        {category === 'terminal' && <TerminalSection />}
      </div>
    </div>
  );
}
