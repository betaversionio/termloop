import type { StorageCredential } from "@termloop/shared";
import { Badge } from "@/components/ui/badge";
import { StorageStatsBar } from "@/features/storage/components/storage-stats-bar";
import { useStorageBucketList } from "@/features/storage/hooks/use-storage-explorer";
import { Skeleton } from "@/components/ui/skeleton";
import { Bucket } from "iconsax-react";
import { Link, useParams } from "@tanstack/react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const providerLabels: Record<string, string> = {
  s3: "AWS S3",
  r2: "Cloudflare R2",
  minio: "MinIO",
  other: "S3 Compatible",
  gcs: "Google Cloud Storage",
};

interface StorageOverviewPageProps {
  credential: StorageCredential;
}

export function StorageOverviewPage({ credential }: StorageOverviewPageProps) {
  const { id } = useParams({ strict: false });
  const { data: bucketsData, isLoading } = useStorageBucketList(credential.id);
  const buckets = bucketsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Credential info */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Credential Info</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-base font-medium">{credential.name}</h3>
            <Badge variant="secondary" className="text-[11px]">
              {credential.type === "s3" ? "S3" : "GCS"}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {providerLabels[credential.provider] ?? credential.provider}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Added {dayjs(credential.createdAt).fromNow()}
          </p>
        </div>
      </div>

      {/* Stats for default bucket */}
      {credential.defaultBucket && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Default Bucket</h2>
          <StorageStatsBar
            credentialId={credential.id}
            bucket={credential.defaultBucket}
            provider={credential.provider}
          />
        </div>
      )}

      {/* Bucket list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Buckets
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : buckets.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
            <p className="text-sm">No buckets found for this credential</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {buckets.map((b) => (
              <Link
                key={b.name}
                to="/storage/$id/b/$bucket"
                params={{ id: id!, bucket: b.name }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <Bucket size={18} color="currentColor" className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  {b.creationDate && (
                    <p className="text-xs text-muted-foreground">
                      Created {dayjs(b.creationDate).fromNow()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
