import { Outlet, useParams, useOutletContext } from "react-router-dom";
import type { StorageCredential } from "@termloop/shared";
import { useStorage } from "@/features/storage/hooks/use-storage";

interface StorageContext {
  credentialId: string;
  credential: StorageCredential;
}

export function useStorageContext() {
  return useOutletContext<StorageContext>();
}

export function StoragePage() {
  const { id } = useParams<{ id: string }>();

  const { data } = useStorage();
  const credentials = (data?.data as StorageCredential[] | undefined) ?? [];
  const credential = credentials.find((c) => c.id === id);

  if (!credential) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Credential not found
      </div>
    );
  }

  return <Outlet context={{ credentialId: id!, credential }} />;
}
