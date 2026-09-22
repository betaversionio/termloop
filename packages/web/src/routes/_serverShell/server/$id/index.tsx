import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_serverShell/server/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/server/$id/overview", params });
  },
});
