import { useState, useEffect } from "react";
import type { BucketObject } from "@termloop/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentDownload } from "iconsax-react";
import { formatBytes } from "@/lib/utils";
import { storageApi } from "../api";

interface StorageFilePreviewProps {
  open: boolean;
  onClose: () => void;
  object: BucketObject | null;
  credentialId: string;
  bucket: string;
}

const imageExts = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"]);
const videoExts = new Set(["mp4", "webm", "mov", "avi", "mkv"]);
const audioExts = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a"]);
const pdfExts = new Set(["pdf"]);
const textExts = new Set([
  "txt", "json", "md", "yaml", "yml", "xml", "csv", "log",
  "js", "ts", "jsx", "tsx", "css", "html", "htm", "py",
  "rb", "go", "rs", "java", "c", "cpp", "h", "sh", "bash",
  "toml", "ini", "cfg", "env", "sql", "graphql",
]);

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getPreviewType(name: string): "image" | "video" | "audio" | "pdf" | "text" | "unknown" {
  const ext = getExtension(name);
  if (imageExts.has(ext)) return "image";
  if (videoExts.has(ext)) return "video";
  if (audioExts.has(ext)) return "audio";
  if (pdfExts.has(ext)) return "pdf";
  if (textExts.has(ext)) return "text";
  return "unknown";
}

export function StorageFilePreview({
  open,
  onClose,
  object,
  credentialId,
  bucket,
}: StorageFilePreviewProps) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !object) {
      setViewUrl(null);
      setTextContent(null);
      return;
    }

    const type = getPreviewType(object.name);
    setLoading(true);

    if (type === "text") {
      storageApi
        .getViewUrl(credentialId, bucket, object.key)
        .then(async (res) => {
          if (res.data) {
            const resp = await fetch(res.data);
            const text = await resp.text();
            setTextContent(text);
          }
        })
        .finally(() => setLoading(false));
    } else if (type !== "unknown") {
      storageApi
        .getViewUrl(credentialId, bucket, object.key)
        .then((res) => {
          if (res.data) setViewUrl(res.data);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [open, object, credentialId, bucket]);

  const handleDownload = async () => {
    if (!object) return;
    const res = await storageApi.getDownloadUrl(credentialId, bucket, object.key);
    if (res.data) {
      window.open(res.data, "_blank");
    }
  };

  if (!object) return null;

  const type = getPreviewType(object.name);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-6 py-4">
          <div className="min-w-0">
            <DialogTitle className="truncate">{object.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(object.size)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <DocumentDownload size={14} color="currentColor" />
            Download
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
          {loading ? (
            <Skeleton className="h-48 w-48 rounded-lg" />
          ) : type === "image" && viewUrl ? (
            <img
              src={viewUrl}
              alt={object.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          ) : type === "video" && viewUrl ? (
            <video
              src={viewUrl}
              controls
              className="max-w-full max-h-[70vh] rounded"
            />
          ) : type === "audio" && viewUrl ? (
            <audio src={viewUrl} controls className="w-full max-w-md" />
          ) : type === "pdf" && viewUrl ? (
            <iframe
              src={viewUrl}
              className="w-full h-[70vh] rounded border"
              title={object.name}
            />
          ) : type === "text" && textContent !== null ? (
            <pre className="w-full max-h-[70vh] overflow-auto rounded-lg border bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-all">
              {textContent}
            </pre>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <p className="text-sm">Preview not available for this file type</p>
              <Button variant="outline" onClick={handleDownload}>
                <DocumentDownload size={14} color="currentColor" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
