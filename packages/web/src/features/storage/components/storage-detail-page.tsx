import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
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
import type { BucketObject, StorageCredential } from "@termloop/shared";
import {
  useStorageBucketObjects,
  useDeleteObject,
  useDeleteFolder,
} from "../hooks/use-storage-explorer";
import { storageApi } from "../api";
import { BucketSelector } from "./bucket-selector";
import { StorageStatsBar } from "./storage-stats-bar";
import { StorageExplorerToolbar } from "./storage-explorer-toolbar";
import { StorageObjectGrid } from "./storage-object-grid";
import { StorageObjectList } from "./storage-object-list";
import { StorageFilePreview } from "./storage-file-preview";
import { StorageUploadDialog } from "./storage-upload-dialog";

interface StorageExplorerPageProps {
  credentialId: string;
  credential: StorageCredential;
  initialBucket?: string;
}

type DeleteTarget =
  | { type: "file"; key: string; name: string }
  | { type: "folder"; prefix: string; name: string };

export function StorageExplorerPage({
  credentialId,
  credential,
  initialBucket,
}: StorageExplorerPageProps) {
  const [selectedBucket, setSelectedBucket] = useState(
    initialBucket ?? credential.defaultBucket ?? "",
  );
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewFile, setPreviewFile] = useState<BucketObject | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Navigation history
  const historyRef = useRef<string[]>([""]);
  const historyIndexRef = useRef(0);

  // Infinite scroll sentinel
  const { ref: scrollRef, inView } = useInView();

  const {
    data: objectsData,
    isLoading: objectsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useStorageBucketObjects(credentialId, selectedBucket, currentPrefix);
  const deleteMutation = useDeleteObject(
    credentialId,
    selectedBucket,
    currentPrefix,
  );
  const deleteFolderMutation = useDeleteFolder(
    credentialId,
    selectedBucket,
    currentPrefix,
  );

  const isDeleting = deleteMutation.isPending || deleteFolderMutation.isPending;

  // Flatten all pages into a single listing
  const { allObjects, allFolders } = useMemo(() => {
    if (!objectsData?.pages) return { allObjects: [] as BucketObject[], allFolders: [] as string[] };
    const seenFolders = new Set<string>();
    const folders: string[] = [];
    const objects: BucketObject[] = [];
    for (const page of objectsData.pages) {
      for (const f of page.data?.folders ?? []) {
        if (!seenFolders.has(f)) {
          seenFolders.add(f);
          folders.push(f);
        }
      }
      objects.push(...(page.data?.objects ?? []));
    }
    return { allObjects: objects, allFolders: folders };
  }, [objectsData]);

  // Auto-fetch next page when sentinel is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const navigateToPrefix = useCallback((prefix: string) => {
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(prefix);
    historyIndexRef.current = historyRef.current.length - 1;
    setCurrentPrefix(prefix);
  }, []);

  const canGoBack = historyIndexRef.current > 0;
  const canGoForward = historyIndexRef.current < historyRef.current.length - 1;

  const goBack = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setCurrentPrefix(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const goForward = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setCurrentPrefix(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const handleBucketChange = (bucket: string) => {
    setSelectedBucket(bucket);
    setCurrentPrefix("");
    historyRef.current = [""];
    historyIndexRef.current = 0;
  };

  const handleDownload = async (key: string) => {
    const res = await storageApi.getDownloadUrl(
      credentialId,
      selectedBucket,
      key,
    );
    if (res.data) {
      window.open(res.data, "_blank");
    }
  };

  const handleDownloadFolder = (prefix: string) => {
    const url = storageApi.getFolderDownloadUrl(
      credentialId,
      selectedBucket,
      prefix,
    );
    window.open(url, "_blank");
  };

  const handleDeleteRequest = (key: string) => {
    const name = key.split("/").filter(Boolean).pop() ?? key;
    setDeleteTarget({ type: "file", key, name });
  };

  const handleDeleteFolderRequest = (prefix: string) => {
    const name = prefix.split("/").filter(Boolean).pop() ?? prefix;
    setDeleteTarget({ type: "folder", prefix, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "file") {
      deleteMutation.mutate(deleteTarget.key, {
        onSuccess: () => {
          toast({ title: "File deleted", description: `"${deleteTarget.name}" has been deleted` });
          setDeleteTarget(null);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Delete failed", description: `Could not delete "${deleteTarget.name}"` });
          setDeleteTarget(null);
        },
      });
    } else {
      deleteFolderMutation.mutate(deleteTarget.prefix, {
        onSuccess: () => {
          toast({ title: "Folder deleted", description: `"${deleteTarget.name}" and its contents have been deleted` });
          setDeleteTarget(null);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Delete failed", description: `Could not delete folder "${deleteTarget.name}"` });
          setDeleteTarget(null);
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with bucket selector */}
      <div className="flex items-center justify-between">
        <StorageStatsBar
          credentialId={credentialId}
          bucket={selectedBucket}
          provider={credential.provider}
        />
        {!initialBucket && (
          <BucketSelector
            credentialId={credentialId}
            value={selectedBucket}
            onChange={handleBucketChange}
          />
        )}
      </div>

      {/* Toolbar */}
      {selectedBucket && (
        <StorageExplorerToolbar
          bucket={selectedBucket}
          prefix={currentPrefix}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNavigate={navigateToPrefix}
          onBack={goBack}
          onForward={goForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onUpload={() => setUploadOpen(true)}
          onRefresh={() => refetch()}
        />
      )}

      {/* Content */}
      {!selectedBucket ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Select a bucket to start browsing</p>
        </div>
      ) : objectsLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {viewMode === "grid" ? (
            <StorageObjectGrid
              objects={allObjects}
              folders={allFolders}
              onNavigateFolder={navigateToPrefix}
              onPreview={setPreviewFile}
              onDownload={handleDownload}
              onDelete={handleDeleteRequest}
              onDeleteFolder={handleDeleteFolderRequest}
              onDownloadFolder={handleDownloadFolder}
            />
          ) : (
            <StorageObjectList
              objects={allObjects}
              folders={allFolders}
              onNavigateFolder={navigateToPrefix}
              onPreview={setPreviewFile}
              onDownload={handleDownload}
              onDelete={handleDeleteRequest}
              onDeleteFolder={handleDeleteFolderRequest}
              onDownloadFolder={handleDownloadFolder}
            />
          )}

          {/* Infinite scroll sentinel */}
          <div ref={scrollRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 border-t p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Loading more...</p>
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      <StorageFilePreview
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        object={previewFile}
        credentialId={credentialId}
        bucket={selectedBucket}
      />

      {/* Upload dialog */}
      <StorageUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        credentialId={credentialId}
        bucket={selectedBucket}
        prefix={currentPrefix}
      />

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
              Delete {deleteTarget?.type === "folder" ? "folder" : "file"} &quot;{deleteTarget?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "folder"
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

// Keep backward-compatible default export for the route
export { StorageExplorerPage as StorageDetailPage };
