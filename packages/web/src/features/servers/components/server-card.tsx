import { useNavigate } from '@tanstack/react-router';
import {
  Monitor,
  Trash,
  Edit2,
  CommandSquare,
  FolderOpen,
  Activity,
  More,
  Key,
  Lock,
} from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConnectionDialog } from '@/features/servers';
import type { ServerConnection } from '@termloop/shared';

interface ServerCardProps {
  connection: ServerConnection;
  onDelete: (id: string) => void;
}

const quickActions = [
  { tab: 'terminal', icon: CommandSquare, label: 'Terminal' },
  { tab: 'files', icon: FolderOpen, label: 'Files' },
  { tab: 'monitor', icon: Activity, label: 'Monitor' },
] as const;

export function ServerCard({ connection: conn, onDelete }: ServerCardProps) {
  const navigate = useNavigate();
  const { openEditDialog } = useConnectionDialog();

  return (
    <Card
      className="group relative overflow-hidden border transition-all hover:shadow-md cursor-pointer"
      onClick={() => navigate({ to: '/server/$id', params: { id: conn.id } })}
    >
      {/* {conn.color && (
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: conn.color }}
        />
      )} */}

      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pl-5 pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
            style={
              conn.color ? { backgroundColor: `${conn.color}15` } : undefined
            }
          >
            <Monitor
              size={20}
              color={conn.color || 'currentColor'}
              variant="Bulk"
              className={!conn.color ? 'text-primary' : undefined}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{conn.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {conn.username}@{conn.host}
              <span className="text-muted-foreground/60">:{conn.port}</span>
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
              <More
                size={16}
                color="currentColor"
                className="text-muted-foreground"
              />
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
      </CardHeader>

      <CardContent className="px-4 pl-5 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[12px] gap-1">
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
      </CardContent>
    </Card>
  );
}
