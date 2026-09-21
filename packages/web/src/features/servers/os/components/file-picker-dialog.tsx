import { useCallback, useEffect, useState } from "react";
import type { RemoteFile } from "@termloop/shared";
import { ChevronRight, Folder } from "lucide-react";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { sftpApi } from "@/features/servers/files/api";
import { getFileIconUrl, getFolderIconUrl } from "@/features/servers/files/lib/file-icon";
import { useFilePickerState, resolveFilePicker } from "@/hooks/use-file-picker";
import { SIDEBAR_SHORTCUTS } from "../lib/os-constants";

function matchesExtension(name: string, extensions?: string[]): boolean {
  if (!extensions || extensions.length === 0) return true;
  const lower = name.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext.toLowerCase()));
}

export function FilePickerDialog() {
  const request = useFilePickerState();
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<RemoteFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!request) return;
    setCurrentPath(request.initialPath);
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

  const toggleSelect = (file: RemoteFile) => {
    if (!matchesExtension(file.name, extensions)) return;
    setSelected((prev) => {
      const next = new Set(multiple ? prev : []);
      if (next.has(file.path)) next.delete(file.path);
      else next.add(file.path);
      return next;
    });
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
      className="sm:max-w-3xl"
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
      <div className="flex h-[420px] -mx-6 -my-4">
        {/* Shortcuts */}
        <div className="w-[140px] shrink-0 border-r border-border py-2 px-1.5 space-y-0.5 overflow-y-auto">
          {SIDEBAR_SHORTCUTS.map((s) => (
            <button
              key={s.path}
              onClick={() => setCurrentPath(s.path)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors",
                currentPath === s.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Folder className="h-3.5 w-3.5 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border text-xs overflow-x-auto shrink-0">
            <button
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setCurrentPath("/")}
            >
              /
            </button>
            {breadcrumbs.map((seg, i) => {
              const path = "/" + breadcrumbs.slice(0, i + 1).join("/");
              return (
                <span key={path} className="flex shrink-0 items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <button
                    className={cn(
                      "hover:text-foreground",
                      path === currentPath ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                    onClick={() => setCurrentPath(path)}
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
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
            ) : (
              <div className="space-y-0.5">
                {files.map((file) => {
                  const isDir = file.type === "directory";
                  const disabled = !isDir && mode === "file" && !matchesExtension(file.name, extensions);
                  const isSelected = selected.has(file.path);
                  return (
                    <button
                      key={file.path}
                      disabled={disabled}
                      onClick={() => (isDir ? setCurrentPath(file.path) : toggleSelect(file))}
                      onDoubleClick={() => {
                        if (!isDir && mode === "file" && matchesExtension(file.name, extensions)) {
                          close([file.path]);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted",
                        disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <img
                        src={isDir ? getFolderIconUrl(file.name) : getFileIconUrl(file.name)}
                        alt=""
                        className="h-4 w-4 shrink-0"
                        draggable={false}
                      />
                      <span className="flex-1 truncate">{file.name}</span>
                      {isDir && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomDialog>
  );
}
