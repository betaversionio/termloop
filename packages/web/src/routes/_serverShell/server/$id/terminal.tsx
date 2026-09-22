import { createFileRoute } from "@tanstack/react-router";
import { TerminalPage } from "@/features/servers/terminal";

export const Route = createFileRoute("/_serverShell/server/$id/terminal")({
  component: TerminalRoute,
});

function TerminalRoute() {
  const { id } = Route.useParams();
  return <TerminalPage connectionId={id} />;
}
