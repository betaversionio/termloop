import { useState } from 'react';
import { Key, Add } from 'iconsax-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import type { SSHKey } from '@termloop/shared';
import {
  useKeychain,
  useDeleteKey,
  KeyCard,
  KeyDialog,
} from '@/features/keychain';

export function KeychainPage() {
  const { data, isLoading } = useKeychain();
  const deleteMutation = useDeleteKey();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState<SSHKey | undefined>();

  const keys = (data?.data as SSHKey[] | undefined) ?? [];

  const openAdd = () => {
    setEditKey(undefined);
    setDialogOpen(true);
  };

  const openEdit = (key: SSHKey) => {
    setEditKey(key);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditKey(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Keychain" description="Manage your SSH keys">
        <Button onClick={openAdd}>
          <Add size={18} color="currentColor" />
          Add Key
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Key
            size={48}
            color="currentColor"
            variant="Linear"
            className="text-muted-foreground/50 mb-4"
          />
          <h2 className="text-lg font-semibold">No SSH keys yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Store your SSH keys centrally and reuse them across server
            connections.
          </p>
          <Button onClick={openAdd}>
            <Add size={18} color="currentColor" />
            Add Key
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keys.map((key) => (
            <KeyCard
              key={key.id}
              sshKey={key}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <KeyDialog open={dialogOpen} onClose={closeDialog} editKey={editKey} />
    </div>
  );
}
