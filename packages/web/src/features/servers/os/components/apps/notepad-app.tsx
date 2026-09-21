import { useState, useEffect, useCallback } from "react";
import { FolderOpen } from "lucide-react";
import { sftpApi } from "@/features/servers/files/api";
import { openFilePicker } from "@/hooks/use-file-picker";
import { useWindowManager } from "../../context/window-manager-context";
import { useMarketplace } from "@/features/servers/marketplace/components/marketplace-context";

interface NotepadAppProps {
  connectionId: string;
  payload?: Record<string, unknown>;
  windowId: string;
}

export function NotepadApp({ connectionId, payload, windowId }: NotepadAppProps) {
  const filePath = payload?.filePath as string | undefined;
  const fileName = payload?.fileName as string | undefined;

  const { dispatch } = useWindowManager();
  const { resolveFileHandler } = useMarketplace();

  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = content !== savedContent;

  const loadFile = useCallback(async () => {
    if (!filePath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await sftpApi.read(connectionId, filePath);
    if (res.success && res.data) {
      setContent(res.data.content);
      setSavedContent(res.data.content);
    } else {
      setError(res.success ? "Empty response" : res.error ?? "Failed to read file");
    }
    setLoading(false);
  }, [connectionId, filePath]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  const handleOpenFile = async () => {
    const result = await openFilePicker({ connectionId, mode: "file" });
    if (!result || result.length === 0) return;
    const path = result[0];
    dispatch({
      type: "OPEN",
      appType: resolveFileHandler(path),
      payload: { filePath: path, fileName: path.split("/").pop() },
    });
    dispatch({ type: "CLOSE", id: windowId });
  };

  if (!filePath) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm">No file open</p>
        <button
          className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          onClick={handleOpenFile}
        >
          Open File…
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!filePath || !dirty) return;
    setSaving(true);
    const res = await sftpApi.write(connectionId, filePath, content);
    if (res.success) {
      setSavedContent(content);
    } else {
      setError(res.error ?? "Failed to save file");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-destructive">{error}</p>
        <button
          className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          onClick={loadFile}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-1.5">
        <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
          {fileName ?? filePath}
        </span>
        {dirty && (
          <span className="text-[10px] text-amber-500 dark:text-amber-400">
            unsaved
          </span>
        )}
        <button
          className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Editor */}
      <textarea
        className="flex-1 resize-none bg-card p-3 font-mono text-sm text-foreground outline-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
