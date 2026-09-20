import type { BucketObject } from "@termloop/shared";
import { ExplorerList } from "@/components/shared/file-explorer";
import type { FileItem, FolderItem } from "@/components/shared/file-explorer";

interface StorageObjectListProps {
  objects: BucketObject[];
  folders: string[];
  onNavigateFolder: (prefix: string) => void;
  onPreview: (obj: BucketObject) => void;
  onDownload: (key: string) => void;
  onDelete: (key: string) => void;
  onDeleteFolder?: (prefix: string) => void;
  onDownloadFolder?: (prefix: string) => void;
}

export function StorageObjectList({
  objects,
  folders,
  onNavigateFolder,
  onPreview,
  onDownload,
  onDelete,
  onDeleteFolder,
  onDownloadFolder,
}: StorageObjectListProps) {
  const folderItems: FolderItem[] = folders.map((f) => ({
    key: f,
    name: f.split("/").filter(Boolean).pop()!,
  }));

  const fileItems: FileItem[] = objects.map((o) => ({
    key: o.key,
    name: o.name,
    isFolder: false,
    size: o.size,
    lastModified: o.lastModified,
    extra: o.storageClass,
  }));

  const objectMap = new Map(objects.map((o) => [o.key, o]));

  return (
    <ExplorerList
      files={fileItems}
      folders={folderItems}
      emptyMessage="This bucket is empty"
      extraColumn={{ label: "Storage Class" }}
      onNavigateFolder={onNavigateFolder}
      onOpen={(f) => {
        const obj = objectMap.get(f.key);
        if (obj) onPreview(obj);
      }}
      onDownload={onDownload}
      onDelete={onDelete}
      onDeleteFolder={onDeleteFolder}
      onDownloadFolder={onDownloadFolder}
    />
  );
}
