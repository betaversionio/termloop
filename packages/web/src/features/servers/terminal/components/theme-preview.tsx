import type { TerminalThemeDefinition } from '../lib/terminal-themes';

/** Mini terminal preview swatch — shared by the terminal's Appearance sheet and Settings app. */
export function ThemePreview({ theme }: { theme: TerminalThemeDefinition }) {
  const t = theme.theme;
  return (
    <div
      className="w-[72px] h-[48px] rounded-md border border-white/10 p-1.5 flex flex-col gap-1 shrink-0"
      style={{ background: t.background }}
    >
      {/* Fake terminal lines */}
      <div className="flex gap-0.5 items-center">
        <span
          className="h-[3px] w-3 rounded-full"
          style={{ background: t.green }}
        />
        <span
          className="h-[3px] w-5 rounded-full"
          style={{ background: t.foreground, opacity: 0.5 }}
        />
      </div>
      <div className="flex gap-0.5 items-center">
        <span
          className="h-[3px] w-4 rounded-full"
          style={{ background: t.blue }}
        />
        <span
          className="h-[3px] w-2 rounded-full"
          style={{ background: t.yellow }}
        />
        <span
          className="h-[3px] w-3 rounded-full"
          style={{ background: t.foreground, opacity: 0.4 }}
        />
      </div>
      <div className="flex gap-0.5 items-center">
        <span
          className="h-[3px] w-2 rounded-full"
          style={{ background: t.magenta }}
        />
        <span
          className="h-[3px] w-2 rounded-full"
          style={{ background: t.red }}
        />
        <span
          className="h-[3px] w-4 rounded-full"
          style={{ background: t.cyan }}
        />
      </div>
    </div>
  );
}
