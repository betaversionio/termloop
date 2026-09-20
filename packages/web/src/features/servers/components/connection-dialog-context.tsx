import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { ConnectionDialog } from "./connection-dialog";
import { ProviderDialog, type CloudProvider } from "./provider-dialog";
import { SSHConfigImportDialog } from "./ssh-config-import-dialog";
import type { ServerConnection } from "@termloop/shared";

interface ConnectionDialogContextValue {
  openAddDialog: () => void;
  openEditDialog: (connection: ServerConnection) => void;
  openProviderDialog: (provider: CloudProvider) => void;
  openSSHConfigImport: () => void;
}

const ConnectionDialogContext = createContext<ConnectionDialogContextValue | null>(null);

export function ConnectionDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editConnection, setEditConnection] = useState<ServerConnection | undefined>();
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);
  const [sshConfigImportOpen, setSSHConfigImportOpen] = useState(false);

  const openAddDialog = useCallback(() => {
    setEditConnection(undefined);
    setOpen(true);
  }, []);

  const openEditDialog = useCallback((connection: ServerConnection) => {
    setEditConnection(connection);
    setOpen(true);
  }, []);

  const openProviderDialog = useCallback((provider: CloudProvider) => {
    setSelectedProvider(provider);
    setProviderDialogOpen(true);
  }, []);

  const openSSHConfigImport = useCallback(() => {
    setSSHConfigImportOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditConnection(undefined);
  }, []);

  const handleProviderClose = useCallback(() => {
    setProviderDialogOpen(false);
    setSelectedProvider(null);
  }, []);

  const handleSSHConfigClose = useCallback(() => {
    setSSHConfigImportOpen(false);
  }, []);

  return (
    <ConnectionDialogContext.Provider
      value={{ openAddDialog, openEditDialog, openProviderDialog, openSSHConfigImport }}
    >
      {children}
      <ConnectionDialog open={open} onClose={handleClose} editConnection={editConnection} />
      <ProviderDialog
        open={providerDialogOpen}
        onClose={handleProviderClose}
        provider={selectedProvider}
      />
      <SSHConfigImportDialog open={sshConfigImportOpen} onClose={handleSSHConfigClose} />
    </ConnectionDialogContext.Provider>
  );
}

export function useConnectionDialog() {
  const ctx = useContext(ConnectionDialogContext);
  if (!ctx) throw new Error("useConnectionDialog must be used within ConnectionDialogProvider");
  return ctx;
}
