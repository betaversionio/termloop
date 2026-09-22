import { createFileRoute } from "@tanstack/react-router";
import { StorageExplorerPage } from "@/features/storage";
import { useStorageCredential } from "@/features/storage";

export const Route = createFileRoute("/_storageShell/storage/$id/b/$bucket")({
  component: StorageExplorerRoute,
});

function StorageExplorerRoute() {
  const { id, bucket } = Route.useParams();
  const credential = useStorageCredential(id);
  // TanStack Router already decodes URL params — bucket is the plain (un-encoded) name.
  if (!credential) return null;
  return (
    <StorageExplorerPage
      key={bucket}
      credentialId={id}
      credential={credential}
      initialBucket={bucket}
    />
  );
}
