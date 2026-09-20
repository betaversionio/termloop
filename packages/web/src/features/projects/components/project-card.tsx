import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Trash,
  Edit2,
  More,
  Monitor,
  CloudConnection,
} from 'iconsax-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@termloop/shared';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();
  const serverCount = project.serverIds?.length ?? 0;
  const bucketCount = project.storageCredentialIds?.length ?? 0;

  return (
    <Card
      className="group relative overflow-hidden border transition-all hover:shadow-md cursor-pointer"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pl-5 pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
            style={
              project.color
                ? { backgroundColor: `${project.color}15` }
                : undefined
            }
          >
            <FolderOpen
              size={20}
              color={project.color || 'currentColor'}
              variant="Bulk"
              className={!project.color ? 'text-primary' : undefined}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {project.description}
              </p>
            )}
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
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Edit2 size={14} color="currentColor" className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(project.id)}
            >
              <Trash size={14} color="currentColor" className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="px-4 pl-5 py-3" />

      <CardFooter className="gap-3 px-4 pl-5 pt-3 pb-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Monitor size={14} color="currentColor" />
          <span>
            {serverCount} {serverCount === 1 ? 'server' : 'servers'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CloudConnection size={14} color="currentColor" />
          <span>
            {bucketCount} {bucketCount === 1 ? 'storage' : 'storages'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
