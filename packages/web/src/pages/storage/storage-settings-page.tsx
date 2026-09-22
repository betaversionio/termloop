import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Trash, TickCircle, CloseCircle, Key } from 'iconsax-react';
import type { StorageCredential } from '@termloop/shared';
import {
  useDeleteStorage,
  useTestStorageCredential,
} from '@/features/storage/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface StorageSettingsPageProps {
  credential: StorageCredential;
}

const providerLabels: Record<string, string> = {
  s3: 'AWS S3',
  r2: 'Cloudflare R2',
  minio: 'MinIO',
  other: 'S3 Compatible',
  gcs: 'Google Cloud Storage',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function StorageSettingsPage({ credential }: StorageSettingsPageProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteStorage();
  const testMutation = useTestStorageCredential();
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate(credential.id, {
      onSuccess: (res) => {
        setTestResult(
          res.success
            ? { success: true, message: 'Connection successful' }
            : { success: false, message: res.error ?? 'Connection failed' },
        );
      },
      onError: () => {
        setTestResult({ success: false, message: 'Connection failed' });
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(credential.id, {
      onSuccess: () => navigate({ to: '/storage' }),
    });
  };

  return (
    <div className="w-full space-y-8">
      {/* Credential Info */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Credential</h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border px-4">
          <InfoRow label="Name" value={credential.name} />
          <InfoRow
            label="Type"
            value={
              <Badge variant="secondary" className="gap-1">
                {credential.type === 's3' ? 'S3' : 'GCS'}
              </Badge>
            }
          />
          <InfoRow
            label="Provider"
            value={providerLabels[credential.provider] ?? credential.provider}
          />
          {credential.type === 's3' && (
            <>
              <InfoRow
                label="Endpoint"
                value={
                  <span className="font-mono text-xs">
                    {credential.endpointUrl}
                  </span>
                }
              />
              <InfoRow label="Region" value={credential.region} />
              <InfoRow
                label="Access Key"
                value={
                  <span className="font-mono text-xs">
                    {credential.accessKeyId}
                  </span>
                }
              />
            </>
          )}
          {credential.defaultBucket && (
            <InfoRow label="Default Bucket" value={credential.defaultBucket} />
          )}
        </div>
      </section>

      {/* Test Connection */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Test Connection</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Verify that the storage provider is reachable with the current
            credentials.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTest}
              isLoading={testMutation.isPending}
            >
              <Key size={14} color="currentColor" />
              Test Connection
            </Button>
            {testResult && (
              <span
                className={`flex items-center gap-1.5 text-sm ${
                  testResult.success ? 'text-emerald-500' : 'text-destructive'
                }`}
              >
                {testResult.success ? (
                  <TickCircle size={16} color="currentColor" />
                ) : (
                  <CloseCircle size={16} color="currentColor" />
                )}
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-lg font-semibold text-destructive mb-4">
          Danger Zone
        </h2>
        <div className="rounded-lg border border-destructive/30 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete this credential</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. The credential will be permanently
                removed.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-white">
                  <Trash size={14} color="currentColor" className="mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete &quot;{credential.name}&quot;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the bucket credential. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
