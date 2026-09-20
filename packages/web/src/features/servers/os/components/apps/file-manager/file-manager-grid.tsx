import type { RemoteFile } from "@termloop/shared";
import { getFileIconUrl, getFolderIconUrl } from "@/features/servers/files/lib/file-icon";
import { useWindowManager } from "../../../context/window-manager-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";

interface FileManagerGridProps {
  files: RemoteFile[];
  onNavigate: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, file: RemoteFile) => void;
}

export function FileManagerGrid({
  files,
  onNavigate,
  onContextMenu,
}: FileManagerGridProps) {
  const { dispatch } = useWindowManager();
  const { resolveFileHandler } = useMarketplace();
  return (
    <div className="grid gap-1 p-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))" }}>
      {files.map((file) => {
        const isDir = file.type === "directory";
        const iconUrl = isDir
          ? getFolderIconUrl(file.name)
          : getFileIconUrl(file.name);

        return (
          <button
            key={file.path}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent/50 transition-colors select-none"
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
