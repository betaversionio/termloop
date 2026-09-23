import { useCallback, useEffect, useState } from "react";
import type { RemoteFile } from "@termloop/shared";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { sftpApi } from "@/features/servers/files/api";
import { useFilePickerState, resolveFilePicker } from "@/hooks/use-file-picker";
import { FileManagerSidebar } from "./apps/file-manager/file-manager-sidebar";
import { FilePickerGrid } from "./file-picker-grid";
import { FilePickerList } from "./file-picker-list";

function matchesExtension(name: string, extensions?: string[]): boolean {
  if (!extensions || extensions.length === 0) return true;
  const lower = name.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext.toLowerCase()));
}

export function FilePickerDialog() {
  const request = useFilePickerState();
  const [currentPath, setCurrentPath] = useState("/");
  const [history, setHistory] = useState<string[]>(["/"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [files, setFiles] = useState<RemoteFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!request) return;
    setCurrentPath(request.initialPath);
    setHistory([request.initialPath]);
    setHistoryIndex(0);
    setSelected(new Set());
  }, [request]);

  const load = useCallback(async (connectionId: string, path: string) => {
    setLoading(true);
    setError(null);
    const res = await sftpApi.list(connectionId, path);
    if (res.success && res.data) {
      setFiles(res.data);
    } else {
      setError(res.error ?? "Failed to list directory");
      setFiles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!request) return;
    load(request.connectionId, currentPath);
  }, [request, currentPath, load]);

  if (!request) return null;

  const { mode, multiple, title, extensions } = request;

  const close = (result: string[] | null) => resolveFilePicker(result);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelected(new Set());
    const next = history.slice(0, historyIndex + 1);
    next.push(path);
    setHistory(next);
    setHistoryIndex(next.length - 1);
  };

  const goBack = () => {
    if (historyIndex === 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setCurrentPath(history[nextIndex]);
    setSelected(new Set());
  };

  const goForward = () => {
    if (historyIndex === history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setCurrentPath(history[nextIndex]);
    setSelected(new Set());
  };

  const isDisabled = (file: RemoteFile) =>
    mode === "file" && !matchesExtension(file.name, extensions);

  const toggleSelect = (file: RemoteFile) => {
    if (isDisabled(file)) return;
    setSelected((prev) => {
      const next = new Set(multiple ? prev : []);
      if (next.has(file.path)) next.delete(file.path);
      else next.add(file.path);
      return next;
    });
  };

  const openEntry = (file: RemoteFile) => {
    if (file.type === "directory") {
      navigateTo(file.path);
    } else if (mode === "file" && !isDisabled(file)) {
      close([file.path]);
    }
  };

  const breadcrumbs = currentPath.split("/").filter(Boolean);
  const confirmDisabled = mode === "file" && selected.size === 0;

  return (
    <CustomDialog
      open
      onOpenChange={(open) => {
        if (!open) close(null);
      }}
      title={title}
      className="sm:max-w-4xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground truncate">
            {mode === "folder"
              ? currentPath
              : selected.size > 0
                ? `${selected.size} selected`
                : "No selection"}
          </span>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => close(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={confirmDisabled}
              onClick={() => close(mode === "folder" ? [currentPath] : Array.from(selected))}
            >
              {mode === "folder" ? "Select Folder" : "Open"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex h-[480px] -mx-6 -my-4">
        <FileManagerSidebar currentPath={currentPath} onNavigate={navigateTo} />

        <div className="flex flex-1 flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-card shrink-0">
            <button
              onClick={goBack}
              disabled={historyIndex === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goForward}
              disabled={historyIndex === history.length - 1}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex flex-1 items-center gap-0.5 text-xs min-w-0 overflow-x-auto mx-1">
              <button
                onClick={() => navigateTo("/")}
                className="shrink-0 text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted"
              >
                /
              </button>
              {breadcrumbs.map((part, i) => {
                const path = "/" + breadcrumbs.slice(0, i + 1).join("/");
                return (
                  <span key={path} className="flex items-center gap-0.5 shrink-0">
                    <span className="text-muted-foreground/50">/</span>
                    <button
                      onClick={() => navigateTo(path)}
                      className={cn(
                        "truncate px-1 py-0.5 rounded hover:bg-muted",
                        path === currentPath
                          ? "font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {part}
                    </button>
                  </span>
                );
              })}
            </div>

            {/* View mode */}
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted shrink-0"
              title={viewMode === "grid" ? "List view" : "Icon view"}
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </button>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner className="h-5 w-5" />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-xs text-destructive">{error}</div>
            ) : files.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Empty directory
              </div>
            ) : viewMode === "grid" ? (
              <FilePickerGrid
                files={files}
                selected={selected}
                isDisabled={isDisabled}
                onSelect={toggleSelect}
                onOpen={openEntry}
              />
            ) : (
              <FilePickerList
                files={files}
                selected={selected}
                isDisabled={isDisabled}
                onSelect={toggleSelect}
                onOpen={openEntry}
              />
            )}
          </div>
        </div>
      </div>
    </CustomDialog>
  );
}
