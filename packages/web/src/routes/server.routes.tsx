import { Navigate, type RouteObject } from 'react-router-dom';
import {
  ServerPage,
  useServerContext,
} from '@/pages/server/server-overview-page';
import { ServersPage } from '@/pages/servers';
import { OverviewPage } from '@/features/servers/overview';
import { TerminalPage } from '@/features/servers/terminal';
import { FilesPage } from '@/features/servers/files';
import { MonitorPage } from '@/features/servers/monitor';
import { OsPage } from '@/features/servers/os';
import { ServerSettingsPage } from '@/pages/server/server-settings-page';

function OverviewRoute() {
  const { connectionId, connection } = useServerContext();
  return <OverviewPage connectionId={connectionId} connection={connection} />;
}

function TerminalRoute() {
  const { connectionId } = useServerContext();
  return <TerminalPage connectionId={connectionId} />;
}

function FilesRoute() {
  const { connectionId } = useServerContext();
  return <FilesPage connectionId={connectionId} />;
}

function MonitorRoute() {
  const { connectionId } = useServerContext();
  return <MonitorPage connectionId={connectionId} />;
}

function OsRoute() {
  const { connectionId } = useServerContext();
  return <OsPage connectionId={connectionId} />;
}

function SettingsRoute() {
  const { connection } = useServerContext();
  return <ServerSettingsPage connection={connection} />;
}

export const serversListRoute: RouteObject[] = [
  {
    index: true,
    element: <ServersPage />,
  },
];

export const serverRoutes: RouteObject[] = [
  {
    path: 'server/:id',
    element: <ServerPage />,
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: <OverviewRoute /> },
      { path: 'terminal', element: <TerminalRoute /> },
      { path: 'files', element: <FilesRoute /> },
      { path: 'monitor', element: <MonitorRoute /> },
      { path: 'os', element: <OsRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
];
