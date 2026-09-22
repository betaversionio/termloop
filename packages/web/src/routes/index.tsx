import { createBrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { ErrorPage } from "@/pages/error";
import { NotFoundPage } from "@/pages/not-found";
import { ServerLayout } from "@/pages/server";
import { StorageLayout } from "@/pages/storage";
import { ProjectPage } from "@/pages/project";
import { projectsRoutes } from "./projects.routes";
import { serverRoutes, serversListRoute } from "./server.routes";
import { keychainRoutes } from "./keychain.routes";
import { storageRoutes, storageDetailRoutes } from "./storage.routes";
import { settingsRoutes } from "./settings.routes";

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      ...serversListRoute,
      { path: "project/:id", element: <ProjectPage /> },
      ...projectsRoutes,
      ...keychainRoutes,
      ...storageRoutes,
      ...settingsRoutes,
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    element: <ServerLayout />,
    errorElement: <ErrorPage />,
    children: [...serverRoutes],
  },
  {
    element: <StorageLayout />,
    errorElement: <ErrorPage />,
    children: [...storageDetailRoutes],
  },
]);
