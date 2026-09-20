import { useState, useEffect } from "react";
import { Monitor, CloudConnection } from "iconsax-react";
import type { ServerConnection, StorageCredential } from "@termloop/shared";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface AddResourceDialogProps {
  open: boolean;
  type: "servers" | "buckets";
  onClose: () => void;
  allServers: ServerConnection[];
  allBuckets: StorageCredential[];
  currentServerIds: string[];
  currentBucketIds: string[];
  onAddServers: (ids: string[]) => void;
  onAddBuckets: (ids: string[]) => void;
}

export function AddResourceDialog({
  open,
  type,
  onClose,
  allServers,
  allBuckets,
  currentServerIds,
  currentBucketIds,
  onAddServers,
  onAddBuckets,
}: AddResourceDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (type === "servers") {
      onAddServers(selected);
    } else {
      onAddBuckets(selected);
    }
    onClose();
  };

  const isServers = type === "servers";
  const available = isServers
    ? allServers.filter((s) => !currentServerIds.includes(s.id))
    : allBuckets.filter((b) => !currentBucketIds.includes(b.id));

  return (
    <CustomDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isServers ? "Add Servers" : "Add Buckets"}
      className="sm:max-w-md"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0}>
            Add {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        </div>
      }
    >
      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isServers
            ? "All servers are already in this project."
            : "All buckets are already in this project."}
        </p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {isServers
            ? (available as ServerConnection[]).map((conn) => (
                <label
                  key={conn.id}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selected.includes(conn.id)}
                    onCheckedChange={() => toggle(conn.id)}
                  />
                  <Monitor size={14} color={conn.color || "currentColor"} className="shrink-0" />
                  <span className="truncate">{conn.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {conn.host}
                  </span>
                </label>
              ))
            : (available as StorageCredential[]).map((bucket) => (
                <label
                  key={bucket.id}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selected.includes(bucket.id)}
                    onCheckedChange={() => toggle(bucket.id)}
                  />
                  <CloudConnection size={14} color="currentColor" className="shrink-0" />
                  <span className="truncate">{bucket.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground truncate">
                    {bucket.type.toUpperCase()}
                  </span>
                </label>
              ))}
        </div>
      )}
    </CustomDialog>
  );
}
