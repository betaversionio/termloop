import { useState, useRef } from "react";
import { DocumentUpload, TickCircle, Folder2 } from "iconsax-react";
import type { ApiResponse, ServerConnectionInput, SSHKey } from "@termloop/shared";
import { useCreateConnection } from "../hooks/use-connections";
import { useCreateKey } from "../../keychain/hooks/use-keychain";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SSHConfigImportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedHost {
  name: string;
  host: string;
  port: number;
  username: string;
  identityFile?: string;
  selected: boolean;
}

function parseSSHConfig(config: string): ParsedHost[] {
  const hosts: ParsedHost[] = [];
  const lines = config.split("\n");
  let currentHost: Partial<ParsedHost> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split(/\s+/);
    const value = valueParts.join(" ");

    if (key.toLowerCase() === "host") {
      if (currentHost?.name && currentHost?.host) {
        hosts.push({
          name: currentHost.name,
          host: currentHost.host,
          port: currentHost.port || 22,
          username: currentHost.username || "root",
          identityFile: currentHost.identityFile,
          selected: true,
        });
      }
      currentHost = { name: value };
    } else if (currentHost) {
      switch (key.toLowerCase()) {
        case "hostname":
          currentHost.host = value;
          break;
        case "port":
          currentHost.port = parseInt(value, 10);
          break;
        case "user":
          currentHost.username = value;
          break;
        case "identityfile":
          // ssh_config allows quoting paths that contain spaces (common on Windows,
          // e.g. `IdentityFile "C:\Users\Jane Doe\.ssh\id_rsa"`) — strip them so the
          // stored path is usable as-is. Keep any leading "~" intact rather than
          // stripping it: the server resolves "~" against its own HOME/USERPROFILE
          // at connect time (see ssh.service.ts's resolveKeychainKey), the same way
          // it does for keys added manually via the keychain.
          currentHost.identityFile = value.replace(/^"(.*)"$/, "$1");
          break;
      }
    }
  }

  // Add the last host
  if (currentHost?.name && currentHost?.host) {
    hosts.push({
      name: currentHost.name,
      host: currentHost.host,
      port: currentHost.port || 22,
      username: currentHost.username || "root",
      identityFile: currentHost.identityFile,
      selected: true,
    });
  }

  return hosts;
}

export function SSHConfigImportDialog({ open, onClose }: SSHConfigImportDialogProps) {
  const [configText, setConfigText] = useState("");
  const [parsedHosts, setParsedHosts] = useState<ParsedHost[]>([]);
  const [step, setStep] = useState<"input" | "select">("input");
  const createMutation = useCreateConnection();
  const createKeyMutation = useCreateKey();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setConfigText(content);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    try {
      const hosts = parseSSHConfig(configText);
      if (hosts.length === 0) {
        alert("No valid hosts found in the SSH config");
        return;
      }
      setParsedHosts(hosts);
      setStep("select");
    } catch (error) {
      alert("Failed to parse SSH config. Please check the format.");
    }
  };

  const handleToggleHost = (index: number) => {
    setParsedHosts((prev) =>
      prev.map((host, i) => (i === index ? { ...host, selected: !host.selected } : host))
    );
  };

  const handleImport = async () => {
    const selectedHosts = parsedHosts.filter((h) => h.selected);
    if (selectedHosts.length === 0) {
      alert("Please select at least one host to import");
      return;
    }

    // Import hosts one by one
    for (const host of selectedHosts) {
      // A path-based keychain key: the same mechanism a user gets from Keychain →
      // Add Key → Path, resolved lazily on the server at connect time (so this only
      // works when that path exists on the machine termloop's server is running on —
      // the common case for local `npx termloop`, not necessarily for a remote/Docker
      // deployment of a config imported from a different machine).
      let keychainKeyId: string | undefined;
      if (host.identityFile) {
        const result = await new Promise<ApiResponse<SSHKey>>((resolve) => {
          createKeyMutation.mutate(
            { name: `${host.name} (imported)`, type: "path", keyPath: host.identityFile },
            {
              onSuccess: resolve,
              onError: () => resolve({ success: false, error: "Failed to create key" }),
            }
          );
        });
        keychainKeyId = result.success ? result.data?.id : undefined;
      }

      const payload: ServerConnectionInput = {
        name: host.name,
        host: host.host,
        port: host.port,
        username: host.username,
        authMethod: keychainKeyId ? "key" : "password",
        password: "",
        privateKey: "",
        keychainKeyId,
        color: "#6366f1",
      };

      await new Promise((resolve) => {
        createMutation.mutate(payload, {
          onSettled: resolve,
        });
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setConfigText("");
    setParsedHosts([]);
    setStep("input");
    onClose();
  };

  const selectedCount = parsedHosts.filter((h) => h.selected).length;

  return (
    <CustomDialog
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title="Import SSH Config"
      footer={
        <div className="flex w-full justify-end gap-2">
          {step === "select" && (
            <Button variant="outline" onClick={() => setStep("input")}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === "input" ? (
            <Button onClick={handleParse} disabled={!configText.trim()}>
              Parse Config
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0}
              isLoading={createMutation.isPending}
            >
              Import {selectedCount} {selectedCount === 1 ? "Server" : "Servers"}
            </Button>
          )}
        </div>
      }
    >
      {step === "input" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <DocumentUpload size={24} color="currentColor" className="text-primary mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold">Import from SSH Config</h3>
              <p className="text-sm text-muted-foreground">
                Upload your SSH config file or paste its contents (usually located at{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">~/.ssh/config</code>)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SSH Config File Content</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Folder2 size={16} color="currentColor" className="mr-2" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".config,.conf,.txt,*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <Textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={`Host my-server\n  HostName 192.168.1.100\n  Port 22\n  User root\n  IdentityFile ~/.ssh/id_rsa\n\nHost another-server\n  HostName example.com\n  User ubuntu`}
              className="min-h-[280px] font-mono text-xs placeholder:text-muted-foreground"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 <strong>Note:</strong> An <code className="text-xs">IdentityFile</code> path is
              linked from where it lives on disk rather than its contents being copied in — this
              only works if that path exists on the machine termloop's server is running on.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <TickCircle size={24} color="currentColor" className="text-emerald-500 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold">
                Found {parsedHosts.length} {parsedHosts.length === 1 ? "Host" : "Hosts"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Select the servers you want to import
              </p>
            </div>
          </div>

          <ScrollArea className="h-[280px] rounded-lg border">
            <div className="p-4 space-y-3">
              {parsedHosts.map((host, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={host.selected}
                    onCheckedChange={() => handleToggleHost(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{host.name}</div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <div>
                        <span className="font-mono text-xs">{host.username}@{host.host}</span>
                        {host.port !== 22 && (
                          <span className="ml-1 text-xs">:{host.port}</span>
                        )}
                      </div>
                      {host.identityFile && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          🔑 Key: {host.identityFile}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </CustomDialog>
  );
}
