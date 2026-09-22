import { useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Monitor, Add } from "iconsax-react";
import { cn } from "@/lib/utils";
import { useConnections } from "@/features/servers";
import type { ServerConnection } from "@termloop/shared";
import { useServerTabs } from "./server-tabs-context";

export function ServerTabBar() {
  const { openIds, closeTab, reorderTabs } = useServerTabs();
  const { id: activeId } = useParams({ strict: false });
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();
  const { data } = useConnections();
  const connections = (data?.data as ServerConnection[] | undefined) ?? [];
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Only meaningful while actually viewing a server (e.g. "terminal", "files") — this bar
  // also renders on non-server pages now (Dashboard, Servers list, ...), where the current
  // path's last segment isn't a server section at all, so switching/reopening a tab from
  // there should just land on its overview instead.
  const activeSection = pathname.startsWith("/server/")
    ? pathname.split("/").pop() || "overview"
    : "overview";

  // The section is a runtime string, not one of the statically-known route literals, so
  // this goes through navigate's untyped string form rather than the typed { to, params }.
  const goToServerSection = (id: string, section: string) => {
    navigate({ to: `/server/${id}/${section}` });
  };

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const remaining = openIds.filter((tabId) => tabId !== id);
    closeTab(id);
    if (id === activeId) {
      const next = remaining[remaining.length - 1];
      if (next) goToServerSection(next, activeSection);
      else navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
      {openIds.map((id) => {
        const connection = connections.find((c) => c.id === id);
        const isActive = id === activeId;
        const isDragOver = dragOverId === id && draggedId !== id;

        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={() => setDraggedId(id)}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedId && draggedId !== id) setDragOverId(id);
            }}
            onDragLeave={() => setDragOverId((prev) => (prev === id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedId) reorderTabs(draggedId, id);
              setDraggedId(null);
              setDragOverId(null);
            }}
            onClick={() => goToServerSection(id, activeSection)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") goToServerSection(id, activeSection);
            }}
            className={cn(
              "group flex h-8 max-w-[180px] shrink-0 cursor-pointer items-center gap-2 rounded-md pl-2.5 pr-1.5 text-sm transition-colors",
              draggedId === id && "opacity-40",
              isDragOver && "ring-2 ring-primary/50",
              isActive
                ? "bg-accent text-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Monitor
              size={14}
              color={connection?.color || "currentColor"}
              variant="Bulk"
              className={cn("shrink-0", !connection?.color && "text-primary")}
            />
            <span className="truncate">{connection?.name ?? id}</span>
            <button
              onClick={(e) => handleClose(e, id)}
              className="shrink-0 rounded-full p-0.5 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
              aria-label="Close tab"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      <Link
        to="/"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="New tab"
      >
        <Add size={16} color="currentColor" />
      </Link>
    </div>
  );
}
