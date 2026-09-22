import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_storageShell/storage/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/storage/$id/overview", params });
  },
});
