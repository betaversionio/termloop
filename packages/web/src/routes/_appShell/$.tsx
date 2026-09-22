import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/pages/not-found";

export const Route = createFileRoute("/_appShell/$")({
  component: NotFoundPage,
});
