import dayjs from "dayjs";
import type { RemoteFile } from "@termloop/shared";
import { getFileIconUrl, getFolderIconUrl } from "@/features/servers/files/lib/file-icon";
import { formatBytes } from "@/lib/utils";
import { useWindowManager } from "../../../context/window-manager-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";

interface FileManagerListProps {
  files: RemoteFile[];
  onNavigate: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, file: RemoteFile) => void;
}

export function FileManagerList({
  files,
  onNavigate,
  onContextMenu,
}: FileManagerListProps) {
  const { dispatch } = useWindowManager();
  const { resolveFileHandler } = useMarketplace();
  return (
    <div className="flex flex-col text-xs">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border text-muted-foreground font-medium sticky top-0 bg-card">
        <span className="flex-1 min-w-0">Name</span>
        <span className="w-20 text-right">Size</span>
        <span className="w-32 text-right">Modified</span>
        <span className="w-20 font-mono">Permissions</span>
      </div>

      {/* Rows */}
      {files.map((file) => {
        const isDir = file.type === "directory";
        const iconUrl = isDir
          ? getFolderIconUrl(file.name)
          : getFileIconUrl(file.name);

        return (
          <button
            key={file.path}
            className="flex items-center gap-3 px-3 py-1.5 hover:bg-accent/50 transition-colors text-left w-full"
            onDoubleClick={() => {
              if (isDir) {
                onNavigate(file.path);
              } else {
                dispatch({
                  type: "OPEN",
                  appType: resolveFileHandler(file.name),
                  payload: { filePath: file.path, fileName: file.name },
                });
              }
            }}
            onContextMenu={(e) => onContextMenu(e, file)}
          >
            <img src={iconUrl} alt="" className="h-4 w-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate text-foreground">
              {file.name}
            </span>
            <span className="w-20 text-right text-muted-foreground">
              {isDir ? "--" : formatBytes(file.size)}
            </span>
            <span className="w-32 text-right text-muted-foreground">
              {dayjs(file.modifiedAt).format("MMM D, YYYY h:mm A")}
            </span>
            <span className="w-20 font-mono text-muted-foreground">
              {file.permissions}
            </span>
          </button>
        );
      })}
    </div>
  );
}
