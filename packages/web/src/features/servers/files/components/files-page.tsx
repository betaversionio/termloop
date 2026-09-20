import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  ExplorerToolbar,
  ExplorerGrid,
  ExplorerList,
} from "@/components/shared/file-explorer";
import type { FileItem, FolderItem } from "@/components/shared/file-explorer";
import type { RemoteFile } from "@termloop/shared";
import {
  useFileList,
  useDeleteFile,
  useMkdir,
  useUploadFile,
} from "../hooks/use-files";
import { sftpApi } from "../api";

interface FilesPageProps {
  connectionId: string;
}

type DeleteTarget = {
  path: string;
  name: string;
  isDir: boolean;
};

export function FilesPage({ connectionId }: FilesPageProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showMkdir, setShowMkdir] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation history
  const historyRef = useRef<string[]>([""]);
  const historyIndexRef = useRef(0);

  const { data, isLoading, refetch } = useFileList(connectionId, currentPath);
  const deleteMutation = useDeleteFile(connectionId, currentPath);
  const mkdirMutation = useMkdir(connectionId, currentPath, () => {
    setShowMkdir(false);
    setNewDirName("");
  });
  const uploadMutation = useUploadFile(connectionId, currentPath);

  const isDeleting = deleteMutation.isPending;

  const files = (data?.data as RemoteFile[] | undefined) ?? [];

  const navigateTo = useCallback((path: string) => {
    // Normalize: empty string means root "/"
    const target = path || "/";
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(target);
    historyIndexRef.current = historyRef.current.length - 1;
    setCurrentPath(target);
  }, []);

  const canGoBack = historyIndexRef.current > 0;
  const canGoForward =
    historyIndexRef.current < historyRef.current.length - 1;

  const goBack = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setCurrentPath(historyRef.current[historyIndexRef.current] || "/");
    }
  }, []);

  const goForward = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setCurrentPath(historyRef.current[historyIndexRef.current] || "/");
    }
  }, []);

  const pathSegments = currentPath.split("/").filter(Boolean);

  // Convert RemoteFile[] to shared FileItem[] and FolderItem[]
  const folders: FolderItem[] = files
    .filter((f) => f.type === "directory")
    .map((f) => ({ key: f.path, name: f.name }));

  const fileItems: FileItem[] = files
    .filter((f) => f.type !== "directory")
    .map((f) => ({
      key: f.path,
      name: f.name,
      isFolder: false,
      size: f.size,
      lastModified: f.modifiedAt,
      extra: f.permissions,
    }));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  const handleDownload = (path: string) => {
    window.open(sftpApi.download(connectionId, path), "_blank");
  };

  const handleDownloadFolder = (path: string) => {
    window.open(sftpApi.downloadFolder(connectionId, path), "_blank");
  };

  const handleDeleteRequest = (path: string) => {
    const file = files.find((f) => f.path === path);
    if (file) {
      setDeleteTarget({
        path,
        name: file.name,
        isDir: file.type === "directory",
      });
    }
  };

  const handleDeleteFolderRequest = (path: string) => {
    const folder = files.find((f) => f.path === path);
    if (folder) {
      setDeleteTarget({
        path,
        name: folder.name,
        isDir: true,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(
      { path: deleteTarget.path, isDir: deleteTarget.isDir },
      {
        onSuccess: () => {
          toast({
            title: deleteTarget.isDir ? "Folder deleted" : "File deleted",
            description: `"${deleteTarget.name}" has been deleted`,
          });
          setDeleteTarget(null);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Delete failed",
            description: `Could not delete "${deleteTarget.name}"`,
          });
          setDeleteTarget(null);
        },
      }
    );
  };

  const handleOpen = (file: FileItem) => {
    // For server files, download on double-click
    handleDownload(file.key);
  };

  return (
    <div className="space-y-4">
      <ExplorerToolbar
        root="/"
        path={currentPath}
        segments={pathSegments}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigate={(p) => navigateTo(p || "/")}
        onBack={goBack}
        onForward={goForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onUpload={() => fileInputRef.current?.click()}
        onRefresh={() => refetch()}
        onNewFolder={() => setShowMkdir(!showMkdir)}
        buildSegmentPath={(segs, i) => "/" + segs.slice(0, i + 1).join("/")}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUpload}
      />

      {/* New folder input */}
      {showMkdir && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
          <Input
            placeholder="New folder name"
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
            }}
            autoFocus
            className="max-w-xs"
          />
          <Button
            size="sm"
            onClick={() => {
              if (newDirName) {
                const path =
                  currentPath === "/"
                    ? `/${newDirName}`
                    : `${currentPath}/${newDirName}`;
                mkdirMutation.mutate(path);
              }
            }}
          >
            Create
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {viewMode === "grid" ? (
            <ExplorerGrid
              files={fileItems}
              folders={folders}
              emptyMessage="Empty directory"
              onNavigateFolder={navigateTo}
              onOpen={handleOpen}
              onDownload={handleDownload}
              onDelete={handleDeleteRequest}
              onDeleteFolder={handleDeleteFolderRequest}
              onDownloadFolder={handleDownloadFolder}
            />
          ) : (
            <ExplorerList
              files={fileItems}
              folders={folders}
              emptyMessage="Empty directory"
              extraColumn={{ label: "Permissions" }}
              onNavigateFolder={navigateTo}
              onOpen={handleOpen}
              onDownload={handleDownload}
              onDelete={handleDeleteRequest}
              onDeleteFolder={handleDeleteFolderRequest}
              onDownloadFolder={handleDownloadFolder}
            />
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.isDir ? "folder" : "file"} &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.isDir
                ? "This will permanently delete this folder and all its contents. This action cannot be undone."
                : "This will permanently delete this file. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
