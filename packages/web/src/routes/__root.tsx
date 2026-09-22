import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ErrorPage } from "@/pages/error";
import { NotFoundPage } from "@/pages/not-found";

export const Route = createRootRoute({
  component: () => <Outlet />,
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
});
