import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Monitor, CloudConnection, Add, Trash } from 'iconsax-react';
import type {
  Project,
  ServerConnection,
  StorageCredential,
} from '@termloop/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useProject,
  useUpdateProject,
  ProjectDialog,
  AddResourceDialog,
} from '@/features/projects';
import { useConnections } from '@/features/servers';
import { useStorage } from '@/features/storage';

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useProject(id!);
  const { data: connectionsData } = useConnections();
  const { data: bucketsData } = useStorage();
  const updateMutation = useUpdateProject();

  const [editOpen, setEditOpen] = useState(false);
  const [addResourceOpen, setAddResourceOpen] = useState<
    'servers' | 'buckets' | null
  >(null);

  const project = data?.data as Project | undefined;
  const allConnections =
    (connectionsData?.data as ServerConnection[] | undefined) ?? [];
  const allBuckets =
    (bucketsData?.data as StorageCredential[] | undefined) ?? [];

  const projectServers = allConnections.filter((c) =>
    project?.serverIds?.includes(c.id),
  );
  const projectBuckets = allBuckets.filter((b) =>
    project?.storageCredentialIds?.includes(b.id),
  );

  const handleRemoveServer = useCallback(
    (serverId: string) => {
      if (!project) return;
      updateMutation.mutate({
        id: project.id,
        data: { serverIds: project.serverIds.filter((s) => s !== serverId) },
      });
    },
    [project, updateMutation],
  );

  const handleRemoveBucket = useCallback(
    (bucketId: string) => {
      if (!project) return;
      updateMutation.mutate({
        id: project.id,
        data: {
          storageCredentialIds: project.storageCredentialIds.filter(
            (b) => b !== bucketId,
          ),
        },
      });
    },
    [project, updateMutation],
  );

  const handleAddServers = useCallback(
    (ids: string[]) => {
      if (!project) return;
      const merged = [...new Set([...project.serverIds, ...ids])];
      updateMutation.mutate({ id: project.id, data: { serverIds: merged } });
    },
    [project, updateMutation],
  );

  const handleAddBuckets = useCallback(
    (ids: string[]) => {
      if (!project) return;
      const merged = [...new Set([...project.storageCredentialIds, ...ids])];
      updateMutation.mutate({
        id: project.id,
        data: { storageCredentialIds: merged },
      });
    },
    [project, updateMutation],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-3 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Skeleton className="h-9 w-20" />
        </div>

        {/* Servers section skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="space-y-2 p-4 pl-5 pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="px-4 pl-5 py-2.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Storages section skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="space-y-2 p-4 pl-5 pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="px-4 pl-5 py-2.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit2 size={14} color="currentColor" className="mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Servers Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor
              size={18}
              color="currentColor"
              className="text-muted-foreground"
            />
            <h2 className="text-lg font-semibold">
              Servers
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({projectServers.length})
              </span>
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddResourceOpen('servers')}
          >
            <Add size={14} color="currentColor" className="mr-1" />
            Add
          </Button>
        </div>

        {projectServers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Monitor
                size={32}
                color="currentColor"
                variant="Linear"
                className="text-muted-foreground/40 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No servers in this project
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setAddResourceOpen('servers')}
              >
                <Add size={14} color="currentColor" className="mr-1" />
                Add Server
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectServers.map((conn) => (
              <Card
                key={conn.id}
                className="group relative overflow-hidden border transition-all hover:shadow-md cursor-pointer"
                onClick={() => navigate(`/server/${conn.id}`)}
              >
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pl-5 pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                      style={
                        conn.color
                          ? { backgroundColor: `${conn.color}15` }
                          : undefined
                      }
                    >
                      <Monitor
                        size={18}
                        color={conn.color || 'currentColor'}
                        variant="Bulk"
                        className={!conn.color ? 'text-primary' : undefined}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{conn.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {conn.username}@{conn.host}:{conn.port}
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveServer(conn.id);
                        }}
                      >
                        <Trash size={14} color="currentColor" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove from project</TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardFooter className="px-4 pl-5 py-2.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {conn.authMethod === 'key' ? 'SSH Key' : 'Password'}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Buckets Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CloudConnection
              size={18}
              color="currentColor"
              className="text-muted-foreground"
            />
            <h2 className="text-lg font-semibold">
              Storages
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({projectBuckets.length})
              </span>
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddResourceOpen('buckets')}
          >
            <Add size={14} color="currentColor" className="mr-1" />
            Add
          </Button>
        </div>

        {projectBuckets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <CloudConnection
                size={32}
                color="currentColor"
                variant="Linear"
                className="text-muted-foreground/40 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No buckets in this project
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setAddResourceOpen('buckets')}
              >
                <Add size={14} color="currentColor" className="mr-1" />
                Add Bucket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectBuckets.map((bucket) => (
              <Card
                key={bucket.id}
                className="group relative overflow-hidden border transition-all hover:shadow-md cursor-pointer"
                onClick={() => navigate(`/storage/${bucket.id}`)}
              >
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4 pl-5 pb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CloudConnection
                        size={18}
                        color="currentColor"
                        variant="Bulk"
                        className="text-primary"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{bucket.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {bucket.type === 's3'
                          ? bucket.provider.toUpperCase()
                          : 'GCS'}
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBucket(bucket.id);
                        }}
                      >
                        <Trash size={14} color="currentColor" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove from project</TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardFooter className="px-4 pl-5 py-2.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {bucket.type.toUpperCase()}
                  </Badge>
                  {bucket.defaultBucket && (
                    <Badge variant="outline" className="text-[11px] ml-1">
                      {bucket.defaultBucket}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Edit dialog */}
      <ProjectDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editProject={project}
      />

      {/* Add resource dialog */}
      <AddResourceDialog
        open={addResourceOpen !== null}
        type={addResourceOpen ?? 'servers'}
        onClose={() => setAddResourceOpen(null)}
        allServers={allConnections}
        allBuckets={allBuckets}
        currentServerIds={project.serverIds}
        currentBucketIds={project.storageCredentialIds}
        onAddServers={handleAddServers}
        onAddBuckets={handleAddBuckets}
      />
    </div>
  );
}
