import { DocumentDownload, Trash } from "iconsax-react";
import dayjs from "dayjs";
import { cn, formatBytes } from "@/lib/utils";
import { sftpApi } from "../api";
import { getFileIconUrl, getFolderIconUrl } from "../lib/file-icon";
import type { RemoteFile } from "@termloop/shared";

interface FileRowProps {
  file: RemoteFile;
  connectionId: string;
  onNavigate: (path: string) => void;
  onDelete: (path: string, isDir: boolean) => void;
}

export function FileRow({
  file,
  connectionId,
  onNavigate,
  onDelete,
}: FileRowProps) {
  const isDir = file.type === "directory";

  const iconUrl = isDir
    ? getFolderIconUrl(file.name)
    : getFileIconUrl(file.name);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 hover:bg-muted/50 group",
        isDir && "cursor-pointer"
      )}
      onClick={() => isDir && onNavigate(file.path)}
    >
      <img src={iconUrl} alt="" className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm truncate">{file.name}</span>
      <span className="text-xs text-muted-foreground w-20 text-right">
        {!isDir ? formatBytes(file.size) : "--"}
      </span>
      <span className="text-xs text-muted-foreground font-mono w-24">
        {file.permissions}
      </span>
      <span className="text-xs text-muted-foreground w-32 text-right">
        {dayjs(file.modifiedAt).format("MMM D, YYYY h:mm A")}
      </span>
      <div className="flex gap-1 w-14 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        {!isDir && (
          <a
            href={sftpApi.download(connectionId, file.path)}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-accent"
          >
            <DocumentDownload size={14} color="currentColor" />
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.path, isDir);
          }}
          className="p-1 rounded hover:bg-destructive/20 text-destructive cursor-pointer"
        >
          <Trash size={14} color="currentColor" />
        </button>
      </div>
    </div>
  );
}
