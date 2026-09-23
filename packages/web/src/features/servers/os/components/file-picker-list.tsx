import dayjs from "dayjs";
import type { RemoteFile } from "@termloop/shared";
import { ChevronRight } from "lucide-react";
import { getFileIconUrl, getFolderIconUrl } from "@/features/servers/files/lib/file-icon";
import { formatBytes, cn } from "@/lib/utils";

interface FilePickerListProps {
  files: RemoteFile[];
  selected: Set<string>;
  isDisabled: (file: RemoteFile) => boolean;
  onSelect: (file: RemoteFile) => void;
  onOpen: (file: RemoteFile) => void;
}

export function FilePickerList({ files, selected, isDisabled, onSelect, onOpen }: FilePickerListProps) {
  return (
    <div className="flex flex-col text-xs">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border text-muted-foreground font-medium sticky top-0 bg-card">
        <span className="flex-1 min-w-0">Name</span>
        <span className="w-20 text-right">Size</span>
        <span className="w-32 text-right">Modified</span>
      </div>

      {/* Rows */}
      {files.map((file) => {
        const isDir = file.type === "directory";
        const iconUrl = isDir ? getFolderIconUrl(file.name) : getFileIconUrl(file.name);
        const disabled = !isDir && isDisabled(file);
        const isSelected = selected.has(file.path);

        return (
          <button
            key={file.path}
            disabled={disabled}
            className={cn(
              "flex items-center gap-3 px-3 py-1.5 transition-colors text-left w-full",
              isSelected ? "bg-primary/15" : "hover:bg-accent/50",
              disabled && "cursor-not-allowed opacity-40"
            )}
            onClick={() => (isDir ? onOpen(file) : onSelect(file))}
            onDoubleClick={() => onOpen(file)}
          >
            <img src={iconUrl} alt="" className="h-4 w-4 shrink-0" draggable={false} />
            <span className="flex-1 min-w-0 truncate text-foreground">{file.name}</span>
            <span className="w-20 text-right text-muted-foreground">
              {isDir ? "--" : formatBytes(file.size)}
            </span>
            <span className="w-32 text-right text-muted-foreground">
              {dayjs(file.modifiedAt).format("MMM D, YYYY h:mm A")}
            </span>
            {isDir && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
          </button>
        );
      })}
    </div>
  );
}
