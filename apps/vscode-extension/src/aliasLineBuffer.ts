import type { AliasResolution } from "./commandAliases.js";

export type AliasLookup = (alias: string) => AliasResolution | undefined;

export interface FeedResult {
  /** What to actually send to the remote shell. */
  toRemote: string;
  /** Text to show locally in the terminal pane only (never sent to the remote) — e.g. an error. */
  toLocal?: string;
}

/**
 * Tracks the current line as a VS Code terminal's raw keystrokes arrive, so that pressing Enter on a
 * line that's exactly "/alias" or "/alias args..." can be swapped for its bound command before the
 * remote shell ever sees it — instead of forwarding the literal "/alias" text.
 *
 * `handleInput` delivers raw keystrokes, not lines: the remote shell owns real line-editing (history,
 * tab completion, etc.), so this can only track a *shadow* copy of the line. Anything that could make
 * the shadow diverge from the remote's real line (arrows, Tab, Ctrl+R, ...) invalidates tracking for
 * that line — it's then just forwarded raw, same as before this feature existed. Fails safe: at worst
 * an alias doesn't expand; it never corrupts input or double-sends anything.
 */
export class AliasLineBuffer {
  private line = "";
  private valid = true;

  feed(data: string, lookup: AliasLookup): FeedResult {
    let toRemote = "";
    let toLocal = "";

    for (const ch of data) {
      if (ch === "\r" || ch === "\n") {
        const trimmed = this.line.trim();
        const spaceIdx = trimmed.indexOf(" ");
        const word = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
        const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
        const result = this.valid && word.startsWith("/") ? lookup(word.slice(1)) : undefined;

        if (result?.command !== undefined) {
          toRemote += "\x15" + result.command + (rest ? " " + rest : "") + "\r";
        } else if (result?.localScript !== undefined) {
          // Running a localScript alias needs an async upload first — can't happen inline as
          // keystrokes arrive. Reject here rather than sending the literal "/alias" text.
          toRemote += "\x15";
          toLocal += `\r\nTermLoop: "/${word.slice(1)}" runs a local script — use the Command Palette's "TermLoop: Insert Command Alias" instead of typing it.\r\n`;
        } else if (result?.error !== undefined) {
          toRemote += "\x15";
          toLocal += `\r\n${result.error}\r\n`;
        } else {
          toRemote += ch;
        }

        this.line = "";
        this.valid = true;
      } else if (ch === "\x7f" || ch === "\x08") {
        // Backspace/delete — the remote's own line editing handles the visible effect; just mirror it.
        this.line = this.line.slice(0, -1);
        toRemote += ch;
      } else if (ch === "\x03" || ch === "\x15") {
        // Ctrl+C, Ctrl+U — the remote clears/aborts the line itself.
        this.line = "";
        toRemote += ch;
      } else if (ch < " " || ch === "\x1b") {
        // Any other control character or escape sequence (arrows, Tab, Ctrl+R, ...) — the shadow copy
        // can no longer be trusted to match the remote's real line for the rest of this line.
        this.valid = false;
        toRemote += ch;
      } else {
        this.line += ch;
        toRemote += ch;
      }
    }

    return toLocal ? { toRemote, toLocal } : { toRemote };
  }
}
