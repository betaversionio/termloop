import {
  CloudConnection,
  Trash,
  Edit2,
  More,
  Calendar,
  Bucket,
  TickCircle,
} from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { StorageCredential } from "@termloop/shared";

dayjs.extend(relativeTime);

const providerLabels: Record<string, string> = {
  s3: "AWS S3",
  r2: "Cloudflare R2",
  minio: "MinIO",
  other: "S3 Compatible",
  gcs: "Google Cloud Storage",
};

interface StorageCardProps {
  credential: StorageCredential;
  onEdit: (cred: StorageCredential) => void;
  onDelete: (id: string) => void;
  onTest?: (id: string) => void;
  onClick?: (cred: StorageCredential) => void;
}

export function StorageCard({ credential, onEdit, onDelete, onTest, onClick }: StorageCardProps) {
  return (
    <Card
      className="group relative overflow-hidden border transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick?.(credential)}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pl-5 pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CloudConnection size={20} color="currentColor" variant="Bulk" className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{credential.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {providerLabels[credential.provider] ?? credential.provider}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <More size={16} color="currentColor" className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(credential)}>
              <Edit2 size={14} color="currentColor" className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTest?.(credential.id)}>
              <TickCircle size={14} color="currentColor" className="mr-2" />
              Test Connection
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(credential.id)}
            >
              <Trash size={14} color="currentColor" className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="px-4 pl-5 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[12px] gap-1">
            {credential.type === "s3" ? "S3" : "GCS"}
          </Badge>
          {credential.defaultBucket && (
            <Badge variant="outline" className="text-[12px] gap-1">
              <Bucket size={10} color="currentColor" />
              {credential.defaultBucket}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2 px-4 pl-5 pt-3 pb-3 border-t border-border">
        <Calendar size={12} color="currentColor" className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground" title={dayjs(credential.createdAt).format("MMM D, YYYY h:mm A")}>
          Added {dayjs(credential.createdAt).fromNow()}
        </span>
      </CardFooter>
    </Card>
  );
}
