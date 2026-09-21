"use client";

import * as React from "react";

export type FilePickerMode = "file" | "folder";

export interface FilePickerOptions {
  connectionId: string;
  mode?: FilePickerMode;
  multiple?: boolean;
  title?: string;
  initialPath?: string;
  /** File extensions to allow (e.g. [".png", ".jpg"]) — ignored in "folder" mode. */
  extensions?: string[];
}

export interface FilePickerRequest {
  connectionId: string;
  mode: FilePickerMode;
  multiple: boolean;
  title: string;
  initialPath: string;
  extensions?: string[];
  resolve: (result: string[] | null) => void;
}

interface State {
  request: FilePickerRequest | null;
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { request: null };

function dispatch(next: State) {
  memoryState = next;
  listeners.forEach((listener) => listener(memoryState));
}

/**
 * Opens the OS-wide file/folder picker and resolves with the selected path(s),
 * or null if the user cancelled. Usable both from built-in apps (import directly)
 * and from marketplace apps via `sdk.ui.pickFile`.
 */
export function openFilePicker(options: FilePickerOptions): Promise<string[] | null> {
  return new Promise((resolve) => {
    dispatch({
      request: {
        connectionId: options.connectionId,
        mode: options.mode ?? "file",
        multiple: options.multiple ?? false,
        title: options.title ?? (options.mode === "folder" ? "Select Folder" : "Open File"),
        initialPath: options.initialPath ?? "/",
        extensions: options.extensions,
        resolve,
      },
    });
  });
}

/** Called by the picker dialog itself once the user confirms or cancels. */
export function resolveFilePicker(result: string[] | null) {
  const { request } = memoryState;
  if (!request) return;
  request.resolve(result);
  dispatch({ request: null });
}

export function useFilePickerState(): FilePickerRequest | null {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return state.request;
}
