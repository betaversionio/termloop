import { useState, useRef, useCallback } from "react";
import type { RemoteFile } from "@termloop/shared";
import {
  useFileList,
  useDeleteFile,
  useMkdir,
  useUploadFile,
} from "@/features/servers/files/hooks/use-files";
import { sftpApi } from "@/features/servers/files/api";
import { FileManagerSidebar } from "./file-manager-sidebar";
import { FileManagerToolbar } from "./file-manager-toolbar";
import { FileManagerGrid } from "./file-manager-grid";
import { FileManagerList } from "./file-manager-list";
import {
  FileManagerContextMenu,
  getFileContextActions,
  getBackgroundContextActions,
} from "./file-manager-context-menu";

interface FileManagerAppProps {
  connectionId: string;
}

export function FileManagerApp({ connectionId }: FileManagerAppProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [history, setHistory] = useState<string[]>(["/"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMkdir, setShowMkdir] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [renaming, setRenaming] = useState<RemoteFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file?: RemoteFile;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useFileList(connectionId, currentPath);
  const deleteMutation = useDeleteFile(connectionId, currentPath);
  const mkdirMutation = useMkdir(connectionId, currentPath, () => {
    setShowMkdir(false);
    setNewDirName("");
  });
  const uploadMutation = useUploadFile(connectionId, currentPath);

  const files = (data?.data as RemoteFile[] | undefined) ?? [];

  const navigateTo = useCallback(
    (path: string) => {
      setCurrentPath(path);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(path);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex]);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file?: RemoteFile) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, file });
    },
    []
  );

  const handleRename = useCallback(
    async (oldPath: string, newName: string) => {
      const parts = oldPath.split("/");
      parts[parts.length - 1] = newName;
      const newPath = parts.join("/");
      await sftpApi.rename(connectionId, oldPath, newPath);
      refetch();
      setRenaming(null);
      setRenameValue("");
    },
    [connectionId, refetch]
  );

  const contextActions = contextMenu?.file
    ? getFileContextActions({
        file: contextMenu.file,
        connectionId,
        onRename: () => {
          setRenaming(contextMenu.file!);
          setRenameValue(contextMenu.file!.name);
        },
        onDelete: () => {
          deleteMutation.mutate({
            path: contextMenu.file!.path,
            isDir: contextMenu.file!.type === "directory",
          });
        },
      })
    : contextMenu
      ? getBackgroundContextActions({
          onNewFolder: () => setShowMkdir(true),
          onUpload: () => fileInputRef.current?.click(),
        })
      : [];

  return (
    <div className="flex h-full">
      <FileManagerSidebar currentPath={currentPath} onNavigate={navigateTo} />

      <div className="flex flex-1 flex-col min-w-0">
        <FileManagerToolbar
          currentPath={currentPath}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          viewMode={viewMode}
          onBack={goBack}
          onForward={goForward}
          onNavigate={navigateTo}
          onViewModeChange={setViewMode}
          onNewFolder={() => setShowMkdir(true)}
          onUpload={(file) => uploadMutation.mutate(file)}
          onRefresh={() => refetch()}
        />

        {/* New folder input */}
        {showMkdir && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
            <input
              className="flex-1 max-w-xs rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              placeholder="Folder name"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDirName) {
                  const path =
                    currentPath === "/"
                      ? `/${newDirName}`
                      : `${currentPath}/${newDirName}`;
                  mkdirMutation.mutate(path);
                }
                if (e.key === "Escape") {
                  setShowMkdir(false);
                  setNewDirName("");
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (newDirName) {
                  const path =
                    currentPath === "/"
                      ? `/${newDirName}`
                      : `${currentPath}/${newDirName}`;
                  mkdirMutation.mutate(path);
                }
              }}
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowMkdir(false);
                setNewDirName("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Rename input */}
        {renaming && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">Rename:</span>
            <input
              className="flex-1 max-w-xs rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue) {
                  handleRename(renaming.path, renameValue);
                }
                if (e.key === "Escape") {
                  setRenaming(null);
                  setRenameValue("");
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (renameValue) handleRename(renaming.path, renameValue);
              }}
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Rename
            </button>
            <button
              onClick={() => {
                setRenaming(null);
                setRenameValue("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Content area */}
        <div
          className="flex-1 overflow-auto"
          onContextMenu={(e) => handleContextMenu(e)}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Loading...
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Empty directory
            </div>
          ) : viewMode === "grid" ? (
            <FileManagerGrid
              files={files}
              onNavigate={navigateTo}
              onContextMenu={(e, file) => handleContextMenu(e, file)}
            />
          ) : (
            <FileManagerList
              files={files}
              onNavigate={navigateTo}
              onContextMenu={(e, file) => handleContextMenu(e, file)}
            />
          )}
        </div>

        {/* Hidden file input for uploads */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMutation.mutate(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <FileManagerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextActions}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
