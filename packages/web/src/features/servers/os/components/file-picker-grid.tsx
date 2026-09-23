import type { RemoteFile } from "@termloop/shared";
import { getFileIconUrl, getFolderIconUrl } from "@/features/servers/files/lib/file-icon";
import { cn } from "@/lib/utils";

interface FilePickerGridProps {
  files: RemoteFile[];
  selected: Set<string>;
  isDisabled: (file: RemoteFile) => boolean;
  onSelect: (file: RemoteFile) => void;
  onOpen: (file: RemoteFile) => void;
}

export function FilePickerGrid({ files, selected, isDisabled, onSelect, onOpen }: FilePickerGridProps) {
  return (
    <div
      className="grid gap-1 p-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))" }}
    >
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
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors select-none",
              isSelected ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-accent/50",
              disabled && "cursor-not-allowed opacity-40"
            )}
            onClick={() => (isDir ? onOpen(file) : onSelect(file))}
            onDoubleClick={() => onOpen(file)}
          >
            <img src={iconUrl} alt="" className="h-10 w-10" draggable={false} />
            <span className="text-[11px] text-foreground text-center leading-tight w-full truncate">
              {file.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
