import { createFileRoute } from "@tanstack/react-router";
import { StorageOverviewPage } from "@/pages/storage/storage-overview-page";
import { useStorageCredential } from "@/features/storage";

export const Route = createFileRoute("/_storageShell/storage/$id/overview")({
  component: OverviewRoute,
});

function OverviewRoute() {
  const { id } = Route.useParams();
  const credential = useStorageCredential(id);
  if (!credential) return null;
  return <StorageOverviewPage credential={credential} />;
}
