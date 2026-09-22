import { createFileRoute } from "@tanstack/react-router";
import { StorageListPage } from "@/pages/storage";

export const Route = createFileRoute("/_appShell/storage")({
  component: StorageListPage,
});
