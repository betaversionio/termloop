// Needed for JSX to type-check under the classic transform (see vite.config.ts) —
// at runtime this import is externalized to the host's own React instance instead of
// bundling a second copy, so you never call anything on it directly.
import React from "react";
import type { TermLoopSDK, MarketplaceAppProps } from "@termloop/react";

// Prefixed with `sudo -n` (non-interactive) so it works whether the SSH user is root,
// has passwordless sudo, or is already in the `docker` group (sudo as root/no-op is
// harmless) — fails fast instead of hanging if sudo would need a password.
const DOCKER = "sudo -n docker";

interface DockerContainer {
  ID: string;
  Names: string;
  Image: string;
  State: string;
  Status: string;
  Ports: string;
}

interface DockerImage {
  ID: string;
  Repository: string;
  Tag: string;
  Size: string;
  CreatedSince: string;
}

const STATE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  running: "default",
  restarting: "secondary",
  paused: "secondary",
  exited: "outline",
  dead: "destructive",
  created: "outline",
};

type View = "containers" | "images";

function parseJsonLines<T>(stdout: string): T[] {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as T;
      } catch {
        return null;
      }
    })
    .filter((v): v is T => v !== null);
}

export function createApp(sdk: TermLoopSDK) {
  const { useState, useCallback, useEffect } = sdk.React;
  const { useSSH, useQuery, useWindow } = sdk.hooks;
  const { Button, Input, Badge, Spinner, toast } = sdk.ui;

  return function DockerApp({ connectionId, windowId }: MarketplaceAppProps) {
    const ssh = useSSH(connectionId);
    const win = useWindow(windowId);
    const [view, setView] = useState<View>("containers");
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [installing, setInstalling] = useState(false);

    // Detect whether Docker is installed at all, separately from listing containers,
    // so we can show a clean "install it" screen instead of a generic error.
    const {
      data: dockerInstalled,
      isLoading: checkingInstalled,
      refetch: recheckInstalled,
    } = useQuery<boolean>({
      queryKey: ["docker-installed", connectionId],
      queryFn: async () => {
        const res = await ssh.execute("which docker >/dev/null 2>&1 && echo yes || echo no");
        return res.stdout.includes("yes");
      },
    });

    const {
      data: containers,
      isLoading: containersLoading,
      isError: containersError,
      error: containersErrorObj,
      refetch: refetchContainers,
      isFetching: containersFetching,
    } = useQuery<DockerContainer[]>({
      queryKey: ["docker-containers", connectionId],
      queryFn: async () => {
        const res = await ssh.execute(`${DOCKER} ps -a --format '{{json .}}'`);
        if (res.code !== 0) throw new Error(res.stderr || "Failed to list containers");
        return parseJsonLines<DockerContainer>(res.stdout);
      },
      enabled: dockerInstalled === true,
      refetchInterval: 5000,
    });

    const {
      data: images,
      isLoading: imagesLoading,
      isError: imagesError,
      error: imagesErrorObj,
      refetch: refetchImages,
      isFetching: imagesFetching,
    } = useQuery<DockerImage[]>({
      queryKey: ["docker-images", connectionId],
      queryFn: async () => {
        const res = await ssh.execute(`${DOCKER} images --format '{{json .}}'`);
        if (res.code !== 0) throw new Error(res.stderr || "Failed to list images");
        return parseJsonLines<DockerImage>(res.stdout);
      },
      enabled: dockerInstalled === true && view === "images",
    });

    const runningCount = containers?.filter((c) => c.State === "running").length ?? 0;

    useEffect(() => {
      if (dockerInstalled && containers) {
        win.setTitle(`Docker — ${runningCount} running / ${containers.length} total`);
      } else {
        win.setTitle("Docker");
      }
    }, [dockerInstalled, runningCount, containers?.length]);

    const installDocker = useCallback(async () => {
      setInstalling(true);
      try {
        const res = await ssh.execute("curl -fsSL https://get.docker.com | sh");
        if (res.code !== 0) {
          throw new Error(res.stderr || "Install script exited with an error");
        }
        toast({ title: "Docker installed" });
        await recheckInstalled();
      } catch (err) {
        toast({
          title: "Failed to install Docker",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setInstalling(false);
      }
    }, [ssh, recheckInstalled]);

    const runContainerAction = useCallback(
      async (id: string, action: "start" | "stop" | "restart" | "rm") => {
        setBusyId(id);
        try {
          const cmd = action === "rm" ? `${DOCKER} rm -f ${id}` : `${DOCKER} ${action} ${id}`;
          const res = await ssh.execute(cmd);
          if (res.code !== 0) throw new Error(res.stderr || `docker ${action} failed`);
          toast({ title: `Container ${action === "rm" ? "removed" : action + "ed"}` });
          refetchContainers();
        } catch (err) {
          toast({
            title: `Failed to ${action} container`,
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive",
          });
        } finally {
          setBusyId(null);
        }
      },
      [ssh, refetchContainers]
    );

    const removeImage = useCallback(
      async (id: string) => {
        setBusyId(id);
        try {
          const res = await ssh.execute(`${DOCKER} rmi ${id}`);
          if (res.code !== 0) throw new Error(res.stderr || "docker rmi failed");
          toast({ title: "Image removed" });
          refetchImages();
        } catch (err) {
          toast({
            title: "Failed to remove image",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive",
          });
        } finally {
          setBusyId(null);
        }
      },
      [ssh, refetchImages]
    );

    // ── Not installed / checking ──────────────────────────────────────────
    if (checkingInstalled) {
      return (
        <div className="flex h-full items-center justify-center bg-background">
          <Spinner className="h-6 w-6" />
        </div>
      );
    }

    if (dockerInstalled === false) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-background text-center px-8">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(180deg, #2496ED, #0B5FBF)" }}
          >
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Docker isn't installed on this server</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Install Docker Engine to manage containers and images here. This runs the
              official install script over SSH and may take a minute.
            </p>
          </div>
          <Button onClick={installDocker} disabled={installing}>
            {installing ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Installing Docker...
              </span>
            ) : (
              "Install Docker"
            )}
          </Button>
        </div>
      );
    }

    // ── Sidebar + content ─────────────────────────────────────────────────
    const isLoading = view === "containers" ? containersLoading : imagesLoading;
    const isFetching = view === "containers" ? containersFetching : imagesFetching;
    const isErrorState = view === "containers" ? containersError : imagesError;
    const errorObj = view === "containers" ? containersErrorObj : imagesErrorObj;
    const refetch = view === "containers" ? refetchContainers : refetchImages;

    const filteredContainers = (containers ?? []).filter(
      (c) =>
        !search ||
        c.Names.toLowerCase().includes(search.toLowerCase()) ||
        c.Image.toLowerCase().includes(search.toLowerCase())
    );
    const filteredImages = (images ?? []).filter(
      (i) =>
        !search ||
        i.Repository.toLowerCase().includes(search.toLowerCase()) ||
        i.Tag.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="flex h-full bg-background text-foreground">
        {/* Sidebar */}
        <nav className="w-[170px] shrink-0 border-r border-border bg-muted/30 py-3 px-2 space-y-0.5">
          <button
            onClick={() => setView("containers")}
            className={
              "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors text-left " +
              (view === "containers" ? "bg-[#2496ED] text-white" : "text-foreground hover:bg-muted")
            }
          >
            <span>Containers</span>
            {containers && <span className="text-xs opacity-80">{containers.length}</span>}
          </button>
          <button
            onClick={() => setView("images")}
            className={
              "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors text-left " +
              (view === "images" ? "bg-[#2496ED] text-white" : "text-foreground hover:bg-muted")
            }
          >
            <span>Images</span>
            {images && <span className="text-xs opacity-80">{images.length}</span>}
          </button>
        </nav>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Input
              placeholder={`Search ${view}...`}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="h-8 text-sm max-w-xs"
            />
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Spinner className="h-3.5 w-3.5" /> : "Refresh"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Spinner className="h-6 w-6" />
              </div>
            )}

            {isErrorState && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                <p className="text-sm font-medium">Couldn't load {view}</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {errorObj instanceof Error ? errorObj.message : String(errorObj)}
                </p>
              </div>
            )}

            {!isLoading && !isErrorState && view === "containers" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Image</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Ports</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No containers found
                      </td>
                    </tr>
                  )}
                  {filteredContainers.map((c) => (
                    <tr key={c.ID} className="border-b border-border hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">{c.Names}</td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[200px]">{c.Image}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={STATE_VARIANT[c.State] ?? "outline"}>{c.State}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[200px]">{c.Ports || "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.State === "running" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === c.ID}
                                onClick={() => runContainerAction(c.ID, "restart")}
                              >
                                Restart
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === c.ID}
                                onClick={() => runContainerAction(c.ID, "stop")}
                              >
                                Stop
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === c.ID}
                              onClick={() => runContainerAction(c.ID, "start")}
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busyId === c.ID}
                            onClick={() => {
                              if (confirm(`Remove container "${c.Names}"? This can't be undone.`)) {
                                runContainerAction(c.ID, "rm");
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isLoading && !isErrorState && view === "images" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Repository</th>
                    <th className="px-4 py-2 font-medium">Tag</th>
                    <th className="px-4 py-2 font-medium">Size</th>
                    <th className="px-4 py-2 font-medium">Created</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No images found
                      </td>
                    </tr>
                  )}
                  {filteredImages.map((img) => (
                    <tr key={`${img.ID}-${img.Tag}`} className="border-b border-border hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium truncate max-w-[240px]">{img.Repository}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{img.Tag}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{img.Size}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{img.CreatedSince}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busyId === img.ID}
                            onClick={() => {
                              if (confirm(`Remove image "${img.Repository}:${img.Tag}"?`)) {
                                removeImage(img.ID);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };
}
