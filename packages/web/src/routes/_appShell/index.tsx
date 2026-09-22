import { createFileRoute } from "@tanstack/react-router";
import { ServersPage } from "@/pages/servers";

export const Route = createFileRoute("/_appShell/")({
  validateSearch: (s: Record<string, unknown>): { tags?: string[] } => ({
    tags: Array.isArray(s["tags"]) ? (s["tags"] as string[]) : undefined,
  }),
  component: ServersPage,
});
