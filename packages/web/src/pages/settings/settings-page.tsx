import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'iconsax-react';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Customize your experience</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex gap-3">
          {themes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              className={cn(
                'flex-1 h-auto py-4 flex-col gap-2',
                theme === value && 'border-primary bg-primary/5',
              )}
              onClick={() => setTheme(value)}
            >
              <Icon
                size={20}
                color="currentColor"
                variant={theme === value ? 'Bulk' : 'Linear'}
              />
              <span className="text-sm">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
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
      </div>
    </div>
  );
}
