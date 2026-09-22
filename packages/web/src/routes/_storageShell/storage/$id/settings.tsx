import { createFileRoute } from "@tanstack/react-router";
import { StorageSettingsPage } from "@/pages/storage/storage-settings-page";
import { useStorageCredential } from "@/features/storage";

export const Route = createFileRoute("/_storageShell/storage/$id/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { id } = Route.useParams();
  const credential = useStorageCredential(id);
  if (!credential) return null;
  return <StorageSettingsPage credential={credential} />;
}
