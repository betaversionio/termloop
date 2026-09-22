import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Trash, Edit2, TickCircle, CloseCircle, Key, Lock, Monitor } from "iconsax-react";
import type { ServerConnection } from "@termloop/shared";
import {
  useDeleteConnection,
  useTestConnection,
  useConnectionDialog,
} from "@/features/servers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog";

interface ServerSettingsPageProps {
  connection: ServerConnection;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function ServerSettingsPage({ connection }: ServerSettingsPageProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteConnection();
  const testMutation = useTestConnection();
  const { openEditDialog } = useConnectionDialog();
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate(connection.id, {
      onSuccess: (res) => {
        setTestResult(
          res.success
            ? { success: true, message: "Connection successful" }
            : { success: false, message: res.error ?? "Connection failed" }
        );
      },
      onError: () => {
        setTestResult({ success: false, message: "Connection failed" });
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(connection.id, {
      onSuccess: () => navigate({ to: "/" }),
    });
  };

  return (
    <div className="w-full space-y-8">
      {/* Connection Info */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Connection</h2>
          <Button variant="outline" size="sm" onClick={() => openEditDialog(connection)}>
            <Edit2 size={14} color="currentColor" className="mr-2" />
            Edit
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card divide-y divide-border px-4">
          <InfoRow label="Name" value={connection.name} />
          <InfoRow
            label="Host"
            value={
              <span className="font-mono text-xs">
                {connection.host}:{connection.port}
              </span>
            }
          />
          <InfoRow label="Username" value={connection.username} />
          <InfoRow
            label="Auth Method"
            value={
              <Badge variant="secondary" className="gap-1">
                {connection.authMethod === "key" ? (
                  <Key size={12} color="currentColor" />
                ) : (
                  <Lock size={12} color="currentColor" />
                )}
                {connection.authMethod === "key" ? "SSH Key" : "Password"}
              </Badge>
            }
          />
          {connection.color && (
            <InfoRow
              label="Color"
              value={
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: connection.color }}
                  />
                  <span className="font-mono text-xs">{connection.color}</span>
                </div>
              }
            />
          )}
          {connection.tags && connection.tags.length > 0 && (
            <InfoRow
              label="Tags"
              value={
                <div className="flex gap-1 flex-wrap">
                  {connection.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              }
            />
          )}
        </div>
      </section>

      {/* Test Connection */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Test Connection</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Verify that the server is reachable with the current credentials.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTest}
              isLoading={testMutation.isPending}
            >
              Test Connection
            </Button>
            {testResult && (
              <span
                className={`flex items-center gap-1.5 text-sm ${
                  testResult.success ? "text-emerald-500" : "text-destructive"
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
        <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
        <div className="rounded-lg border border-destructive/30 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete this server</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. The connection will be permanently removed.
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
                  <AlertDialogTitle>Delete "{connection.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the server connection. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
