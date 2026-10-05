// Needed for JSX to type-check under the classic transform (see vite.config.ts) —
// at runtime this import is externalized to the host's own React instance instead of
// bundling a second copy, so you never call anything on it directly.
import React from "react";
import type { TermLoopSDK, MarketplaceAppProps } from "@termloop/react";

// IBM i's Open Source Package Management tools (yum/tn5250) install here, which isn't
// always on PATH for a non-interactive SSH shell — use the full path for both the
// install check and the actual launch, same convention this project's own
// .termloop/commands.json tn5250 alias already uses.
const TN5250_BIN = "/QOpenSys/pkgs/bin/tn5250";
const YUM_BIN = "/QOpenSys/pkgs/bin/yum";

export function createApp(sdk: TermLoopSDK) {
  const { useState, useCallback, useEffect } = sdk.React;
  const { useSSH, useQuery, useWindow } = sdk.hooks;
  const { Button, Input, Spinner, toast, Terminal } = sdk.ui;

  return function Tn5250App({ connectionId, windowId }: MarketplaceAppProps) {
    const ssh = useSSH(connectionId);
    const win = useWindow(windowId);
    const [host, setHost] = useState("localhost");
    const [connected, setConnected] = useState(false);
    const [installing, setInstalling] = useState(false);

    const {
      data: installed,
      isLoading: checkingInstalled,
      refetch: recheckInstalled,
    } = useQuery<boolean>({
      queryKey: ["tn5250-installed", connectionId],
      queryFn: async () => {
        const res = await ssh.execute(
          `if command -v tn5250 >/dev/null 2>&1 || [ -x ${TN5250_BIN} ]; then echo yes; else echo no; fi`
        );
        return res.stdout.includes("yes");
      },
    });

    useEffect(() => {
      win.setTitle(connected ? `5250 — ${host}` : "tn5250");
    }, [connected, host]);

    const installTn5250 = useCallback(async () => {
      setInstalling(true);
      try {
        const res = await ssh.execute(`${YUM_BIN} install -y tn5250`);
        if (res.code !== 0) {
          throw new Error(res.stderr || "yum install exited with an error");
        }
        toast({ title: "tn5250 installed" });
        await recheckInstalled();
      } catch (err) {
        toast({
          title: "Failed to install tn5250",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setInstalling(false);
      }
    }, [ssh, recheckInstalled]);

    // ── Checking / not installed ──────────────────────────────────────────
    if (checkingInstalled) {
      return (
        <div className="flex h-full items-center justify-center bg-background">
          <Spinner className="h-6 w-6" />
        </div>
      );
    }

    if (installed === false) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0b0f0c] border border-[#2de35c]/30">
            <span className="text-2xl font-bold text-[#33ff66]">5250</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">tn5250 isn't installed on this server</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              tn5250 is a 5250 terminal emulator for connecting to an IBM i system's green-screen
              interface. This installs it via yum in IBM i's PASE/Open Source environment.
            </p>
          </div>
          <Button onClick={installTn5250} disabled={installing}>
            {installing ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Installing tn5250...
              </span>
            ) : (
              "Install tn5250"
            )}
          </Button>
        </div>
      );
    }

    // ── Connect form ──────────────────────────────────────────────────────
    if (!connected) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0b0f0c] border border-[#2de35c]/30">
            <span className="text-2xl font-bold text-[#33ff66]">5250</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Connect to an IBM i system</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Opens a 5250 green-screen session over the connection you're already SSH'd into.
              Leave this as "localhost" to reach the IBM i system this connection belongs to.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={host}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHost(e.target.value)}
              placeholder="localhost"
              className="h-8 text-sm w-48"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" && host.trim()) setConnected(true);
              }}
            />
            <Button size="sm" disabled={!host.trim()} onClick={() => setConnected(true)}>
              Connect
            </Button>
          </div>
        </div>
      );
    }

    // ── Live 5250 session ─────────────────────────────────────────────────
    return (
      <Terminal
        connectionId={connectionId}
        windowId={windowId}
        initialCommand={`${TN5250_BIN} ${host}`}
        className="h-full"
      />
    );
  };
}
