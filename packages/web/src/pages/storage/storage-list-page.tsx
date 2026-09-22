import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CloudConnection, Add } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { toast } from '@/hooks/use-toast';
import type { StorageCredential } from '@termloop/shared';
import {
  useStorage,
  useDeleteStorage,
  useTestStorageCredential,
} from '@/features/storage';
import { StorageCard, StorageDialog } from '@/features/storage';

export function StorageListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useStorage();
  const deleteMutation = useDeleteStorage();
  const testMutation = useTestStorageCredential();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCredential, setEditCredential] = useState<
    StorageCredential | undefined
  >();

  const credentials = (data?.data as StorageCredential[] | undefined) ?? [];

  const openAdd = () => {
    setEditCredential(undefined);
    setDialogOpen(true);
  };

  const openEdit = (cred: StorageCredential) => {
    setEditCredential(cred);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditCredential(undefined);
  };

  const handleTest = (id: string) => {
    toast({
      title: 'Testing connection...',
      description: 'Attempting to connect to storage provider',
    });
    testMutation.mutate(id, {
      onSuccess: (res) => {
        if (res.success) {
          toast({
            title: 'Connection successful',
            description: 'Credentials are valid and working',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Connection failed',
            description: res.error ?? 'Could not connect',
          });
        }
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Connection failed',
          description: 'Could not reach the server',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage"
        description="Manage your cloud storage credentials"
      >
        <Button onClick={openAdd}>
          <Add size={18} color="currentColor" />
          Add Credential
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CloudConnection
            size={48}
            color="currentColor"
            variant="Linear"
            className="text-muted-foreground/50 mb-4"
          />
          <h2 className="text-lg font-semibold">No bucket credentials yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Store your cloud storage credentials for S3, R2, MinIO, or Google
            Cloud Storage.
          </p>
          <Button onClick={openAdd}>
            <Add size={18} color="currentColor" />
            Add Credential
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((cred) => (
            <StorageCard
              key={cred.id}
              credential={cred}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onTest={handleTest}
              onClick={(c) => navigate({ to: '/storage/$id', params: { id: c.id } })}
            />
          ))}
        </div>
      )}

      <StorageDialog
        open={dialogOpen}
        onClose={closeDialog}
        editCredential={editCredential}
      />
    </div>
  );
}
