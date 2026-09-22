import { createBrowserRouter } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
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

// NuqsAdapter needs useNavigate()/useSearchParams(), which only work inside the router
// tree — it has to wrap each top-level route element here, not RouterProvider from outside
// (that's how it was previously wired in main.tsx, which crashes as soon as anything
// actually calls useQueryState).
export const router = createBrowserRouter([
  {
    element: (
      <NuqsAdapter>
        <App />
      </NuqsAdapter>
    ),
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
    element: (
      <NuqsAdapter>
        <ServerLayout />
      </NuqsAdapter>
    ),
    errorElement: <ErrorPage />,
    children: [...serverRoutes],
  },
  {
    element: (
      <NuqsAdapter>
        <StorageLayout />
      </NuqsAdapter>
    ),
    errorElement: <ErrorPage />,
    children: [...storageDetailRoutes],
  },
]);
