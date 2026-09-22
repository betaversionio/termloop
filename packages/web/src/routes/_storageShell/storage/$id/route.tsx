import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useStorageCredential } from "@/features/storage";

export const Route = createFileRoute("/_storageShell/storage/$id")({
  component: StorageDetailLayout,
});

function StorageDetailLayout() {
  const { id } = Route.useParams();
  const credential = useStorageCredential(id);

  if (!credential) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Credential not found
      </div>
    );
  }

  return <Outlet />;
}
