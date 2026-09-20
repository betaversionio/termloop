import {
  Key,
  Trash,
  Edit2,
  More,
  Document,
  DocumentText,
  Calendar,
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
import type { SSHKey } from "@termloop/shared";

dayjs.extend(relativeTime);

interface KeyCardProps {
  sshKey: SSHKey;
  onEdit: (key: SSHKey) => void;
  onDelete: (id: string) => void;
}

export function KeyCard({ sshKey, onEdit, onDelete }: KeyCardProps) {
  return (
    <Card className="group relative overflow-hidden border transition-all hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pl-5 pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Key size={20} color="currentColor" variant="Bulk" className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{sshKey.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {sshKey.type === "path" ? sshKey.keyPath : "Key stored securely"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
            >
              <More size={16} color="currentColor" className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(sshKey)}>
              <Edit2 size={14} color="currentColor" className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(sshKey.id)}
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
            {sshKey.type === "path" ? (
              <Document size={10} color="currentColor" />
            ) : (
              <DocumentText size={10} color="currentColor" />
            )}
            {sshKey.type === "path" ? "File Path" : "Stored Key"}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="gap-2 px-4 pl-5 pt-3 pb-3 border-t border-border">
        <Calendar size={12} color="currentColor" className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground" title={dayjs(sshKey.createdAt).format("MMM D, YYYY h:mm A")}>
          Added {dayjs(sshKey.createdAt).fromNow()}
        </span>
      </CardFooter>
    </Card>
  );
}
