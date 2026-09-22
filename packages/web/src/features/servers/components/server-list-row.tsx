import { useNavigate } from '@tanstack/react-router';
import { Monitor, Trash, Edit2, More, Key, Lock } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConnectionDialog } from '@/features/servers';
import type { ServerConnection } from '@termloop/shared';

interface ServerListRowProps {
  connection: ServerConnection;
  onDelete: (id: string) => void;
}

export function ServerListRow({ connection: conn, onDelete }: ServerListRowProps) {
  const navigate = useNavigate();
  const { openEditDialog } = useConnectionDialog();

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 cursor-pointer transition-colors hover:bg-accent/30"
      onClick={() => navigate({ to: '/server/$id', params: { id: conn.id } })}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"
        style={conn.color ? { backgroundColor: `${conn.color}15` } : undefined}
      >
        <Monitor
          size={18}
          color={conn.color || 'currentColor'}
          variant="Bulk"
          className={!conn.color ? 'text-primary' : undefined}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold">{conn.name}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {conn.username}@{conn.host}
          <span className="text-muted-foreground/60">:{conn.port}</span>
        </p>
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        <Badge variant="secondary" className="gap-1 text-[12px]">
          {conn.authMethod === 'key' ? (
            <Key size={10} color="currentColor" />
          ) : (
            <Lock size={10} color="currentColor" />
          )}
          {conn.authMethod === 'key' ? 'SSH Key' : 'Password'}
        </Badge>
        {conn.tags?.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[12px]">
            {tag}
          </Badge>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <More size={16} color="currentColor" className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => openEditDialog(conn)}>
            <Edit2 size={14} color="currentColor" className="mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(conn.id)}
          >
            <Trash size={14} color="currentColor" className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
