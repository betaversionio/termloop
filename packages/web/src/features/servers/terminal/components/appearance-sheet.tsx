import { useState, useCallback } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import {
  terminalThemes,
  fontFamilyOptions,
  fontSizeOptions,
} from '../lib/terminal-themes';
import { ThemePreview } from './theme-preview';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  themeName: string;
}

interface AppearanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: HTMLElement | null;
  settings: TerminalSettings;
  onFontFamilyChange: (fontFamily: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onThemeNameChange: (themeName: string) => void;
}

export function AppearanceSheet({
  open,
  onOpenChange,
  container,
  settings,
  onFontFamilyChange,
  onFontSizeChange,
  onThemeNameChange,
}: AppearanceSheetProps) {
  const [fontOpen, setFontOpen] = useState(true);

  const decrementSize = useCallback(() => {
    const idx = fontSizeOptions.indexOf(settings.fontSize);
    if (idx > 0) onFontSizeChange(fontSizeOptions[idx - 1]);
  }, [settings.fontSize, onFontSizeChange]);

  const incrementSize = useCallback(() => {
    const idx = fontSizeOptions.indexOf(settings.fontSize);
    if (idx < fontSizeOptions.length - 1) onFontSizeChange(fontSizeOptions[idx + 1]);
  }, [settings.fontSize, onFontSizeChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] p-0"
        container={container}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 pt-4 pb-3 space-y-0">
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription>
              Customize terminal font, size, and theme
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Font — collapsible accordion with font family + text size */}
            <div className="border-b border-border">
              <button
                type="button"
                onClick={() => setFontOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Font
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${fontOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                style={{
                  gridTemplateRows: fontOpen ? '1fr' : '0fr',
                }}
              >
                <div className="overflow-hidden">
                  <div className="space-y-3 px-4 pb-4">
                    {/* Font family */}
                    <Select
                      value={settings.fontFamily}
                      onValueChange={onFontFamilyChange}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent container={container}>
                        {fontFamilyOptions.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Text size stepper */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Text Size
                      </span>
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
                          disabled={
                            settings.fontSize >=
                            fontSizeOptions[fontSizeOptions.length - 1]
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Themes — card list */}
            <div className="py-3">
              <span className="text-sm text-muted-foreground px-4">Themes</span>
              <div className="mt-3">
                {terminalThemes.map((t) => {
                  const isActive = t.id === settings.themeName;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onThemeNameChange(t.id)}
                      className={`flex w-full items-center gap-3 py-2 px-4 text-left transition-colors ${
                        isActive ? 'bg-accent/80' : 'hover:bg-accent'
                      }`}
                    >
                      <ThemePreview theme={t} />
                      <span
                        className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-foreground'}`}
                      >
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
