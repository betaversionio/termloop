import type React from "react";

// ---------------------------------------------------------------------------
//  App props — passed to every marketplace app component
// ---------------------------------------------------------------------------

export interface MarketplaceAppProps {
  /** The active SSH connection ID */
  connectionId: string;
  /** Optional payload (e.g. filePath/fileName when opened via file association) */
  payload?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
//  Server domain types
// ---------------------------------------------------------------------------

export interface ServerConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "key";
  color?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RemoteFile {
  name: string;
  path: string;
  type: "file" | "directory" | "symlink";
  size: number;
  modifiedAt: string;
  permissions: string;
  owner: string;
  group: string;
}

export interface ServerStats {
  hostname: string;
  uptime: number;
  os: string;
  cpu: { model: string; cores: number; usagePercent: number };
  memory: { totalMB: number; usedMB: number; freeMB: number; usagePercent: number };
  disk: { filesystem: string; mount: string; totalGB: number; usedGB: number; freeGB: number; usagePercent: number }[];
  loadAverage: number[];
}

export interface SSHExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type RequestFn = <T>(
  path: string,
  options?: RequestInit
) => Promise<ApiResponse<T>>;

// ---------------------------------------------------------------------------
//  Hook return types
// ---------------------------------------------------------------------------

export interface UseConnectionResult {
  data: ServerConnection | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export interface UseSFTPResult {
  /** List files in a remote directory */
  list: (path: string) => Promise<RemoteFile[]>;
  /** Read a remote file as UTF-8 text */
  read: (path: string) => Promise<string>;
  /** Write text content to a remote file */
  write: (path: string, content: string) => Promise<void>;
  /** Get a download URL for a remote file (binary stream) */
  downloadUrl: (path: string) => string;
  /** Upload a local File to a remote directory */
  upload: (dirPath: string, file: File) => Promise<void>;
  /** Delete a remote file or directory */
  remove: (path: string, isDir?: boolean) => Promise<void>;
  /** Rename/move a remote file */
  rename: (oldPath: string, newPath: string) => Promise<void>;
  /** Create a remote directory */
  mkdir: (path: string) => Promise<void>;
  /** Invalidate cached file listings (triggers refetch) */
  invalidate: (path?: string) => void;
}

export interface UseSSHResult {
  /** Execute a shell command on the remote server */
  execute: (command: string) => Promise<SSHExecResult>;
}

export interface UseStatsResult {
  data: ServerStats | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFileListResult {
  files: RemoteFile[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
//  UI component types — mirrors the host's shadcn/ui components
// ---------------------------------------------------------------------------

type RC<P = object> = React.ComponentType<P>;
type FCWithRef<P = object> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<HTMLElement>
>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {}

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

// ---------------------------------------------------------------------------
//  SDK interface — injected at runtime by the TermLoop host
// ---------------------------------------------------------------------------

export interface TermLoopSDK {
  /** The host's React instance — use this instead of importing React */
  React: typeof React;

  /** Hooks for interacting with the connected server */
  hooks: {
    /**
     * Get connection details (host, username, port, etc.)
     * @example
     * const { data: conn, isLoading } = sdk.hooks.useConnection(connectionId);
     * // conn.host, conn.username, conn.name, ...
     */
    useConnection: (connectionId: string) => UseConnectionResult;

    /**
     * SFTP file operations on the remote server.
     * @example
     * const sftp = sdk.hooks.useSFTP(connectionId);
     * const files = await sftp.list('/home/user');
     * const content = await sftp.read('/etc/hostname');
     * await sftp.write('/tmp/test.txt', 'hello');
     * await sftp.mkdir('/tmp/new-dir');
     * await sftp.remove('/tmp/old-file.txt');
     * await sftp.rename('/tmp/a.txt', '/tmp/b.txt');
     * const url = sftp.downloadUrl('/home/user/image.png');
     * sftp.invalidate('/home/user'); // refetch cached listing
     */
    useSFTP: (connectionId: string) => UseSFTPResult;

    /**
     * Execute SSH commands on the remote server.
     * @example
     * const ssh = sdk.hooks.useSSH(connectionId);
     * const { stdout, stderr, code } = await ssh.execute('ls -la /tmp');
     */
    useSSH: (connectionId: string) => UseSSHResult;

    /**
     * Server stats (CPU, memory, disk, uptime) with 5s auto-refresh.
     * @example
     * const { data: stats, isLoading } = sdk.hooks.useStats(connectionId);
     * // stats.cpu.usagePercent, stats.memory.usedMB, stats.disk[0].usagePercent
     */
    useStats: (connectionId: string) => UseStatsResult;

    /**
     * List files in a directory with React Query caching.
     * @example
     * const { files, isLoading, refetch } = sdk.hooks.useFileList(connectionId, '/home');
     */
    useFileList: (connectionId: string, path: string) => UseFileListResult;

    /** Raw React Query useQuery for custom data fetching */
    useQuery: <TData = unknown, TError = Error>(
      options: {
        queryKey: unknown[];
        queryFn: () => Promise<TData>;
        enabled?: boolean;
        refetchInterval?: number | false;
        staleTime?: number;
        retry?: boolean | number;
      }
    ) => {
      data: TData | undefined;
      error: TError | null;
      isLoading: boolean;
      isError: boolean;
      isFetching: boolean;
      refetch: () => void;
    };

    /** Raw React Query useMutation for custom mutations */
    useMutation: <TData = unknown, TError = Error, TVariables = void>(
      options: {
        mutationFn: (variables: TVariables) => Promise<TData>;
        onSuccess?: (data: TData, variables: TVariables) => void;
        onError?: (error: TError, variables: TVariables) => void;
      }
    ) => {
      mutate: (variables: TVariables) => void;
      mutateAsync: (variables: TVariables) => Promise<TData>;
      data: TData | undefined;
      error: TError | null;
      isLoading: boolean;
      isPending: boolean;
      isError: boolean;
      reset: () => void;
    };
  };

  /** Pre-styled UI components from the host (shadcn/ui) */
  ui: {
    Button: FCWithRef<ButtonProps>;
    Input: FCWithRef<InputProps>;

    Select: RC<{ value?: string; onValueChange?: (v: string) => void; children?: React.ReactNode }>;
    SelectTrigger: FCWithRef<{ className?: string; children?: React.ReactNode }>;
    SelectValue: RC<{ placeholder?: string }>;
    SelectContent: FCWithRef<{ children?: React.ReactNode }>;
    SelectItem: FCWithRef<{ value: string; children?: React.ReactNode }>;

    Card: FCWithRef<React.HTMLAttributes<HTMLDivElement>>;
    CardHeader: FCWithRef<React.HTMLAttributes<HTMLDivElement>>;
    CardTitle: FCWithRef<React.HTMLAttributes<HTMLHeadingElement>>;
    CardDescription: FCWithRef<React.HTMLAttributes<HTMLParagraphElement>>;
    CardContent: FCWithRef<React.HTMLAttributes<HTMLDivElement>>;
    CardFooter: FCWithRef<React.HTMLAttributes<HTMLDivElement>>;

    Tabs: RC<{ value?: string; defaultValue?: string; onValueChange?: (v: string) => void; className?: string; children?: React.ReactNode }>;
    TabsList: FCWithRef<{ className?: string; children?: React.ReactNode }>;
    TabsTrigger: FCWithRef<{ value: string; className?: string; children?: React.ReactNode }>;
    TabsContent: FCWithRef<{ value: string; className?: string; children?: React.ReactNode }>;

    Badge: RC<BadgeProps>;
    Spinner: RC<SpinnerProps>;
    Separator: FCWithRef<SeparatorProps>;

    Dialog: RC<{ open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }>;
    DialogTrigger: FCWithRef<{ asChild?: boolean; children?: React.ReactNode }>;
    DialogContent: FCWithRef<{ className?: string; children?: React.ReactNode }>;
    DialogHeader: RC<React.HTMLAttributes<HTMLDivElement>>;
    DialogTitle: FCWithRef<{ className?: string; children?: React.ReactNode }>;
    DialogDescription: FCWithRef<{ className?: string; children?: React.ReactNode }>;
    DialogFooter: RC<React.HTMLAttributes<HTMLDivElement>>;
    DialogClose: FCWithRef<{ asChild?: boolean; children?: React.ReactNode }>;
  };

  /** Utility functions */
  utils: {
    /** Tailwind class name merger (clsx + twMerge) */
    cn: (...inputs: (string | undefined | null | false)[]) => string;
    /** HTTP request helper — paths relative to API base (e.g. `/sftp/...`, `/stats/...`) */
    request: RequestFn;
  };
}

// ---------------------------------------------------------------------------
//  App factory type
// ---------------------------------------------------------------------------

export type AppFactory = (sdk: TermLoopSDK) => {
  default: React.ComponentType<MarketplaceAppProps>;
};

// ---------------------------------------------------------------------------
//  defineApp — the main entry point for marketplace apps
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __termloop_register?: (id: string, factory: AppFactory) => void;
  }
}

/**
 * Register a TermLoop marketplace app.
 *
 * @example
 * ```tsx
 * import { defineApp, type TermLoopSDK, type MarketplaceAppProps } from '@termloop/react';
 *
 * defineApp('my-image-viewer', (sdk) => {
 *   const { React, ui, hooks } = sdk;
 *   const { useState, useEffect } = React;
 *   const { Button, Spinner } = ui;
 *
 *   function ImageViewer({ connectionId, payload }: MarketplaceAppProps) {
 *     const sftp = hooks.useSFTP(connectionId);
 *     const ssh = hooks.useSSH(connectionId);
 *     const { data: conn } = hooks.useConnection(connectionId);
 *     const filePath = (payload?.filePath as string) || '';
 *
 *     const [src, setSrc] = useState<string | null>(null);
 *
 *     useEffect(() => {
 *       if (filePath) setSrc(sftp.downloadUrl(filePath));
 *     }, [filePath]);
 *
 *     if (!src) return <Spinner />;
 *     return <img src={src} alt="preview" style={{ maxWidth: '100%' }} />;
 *   }
 *
 *   return { default: ImageViewer };
 * });
 * ```
 */
export function defineApp(id: string, factory: AppFactory): void {
  if (typeof window !== "undefined" && window.__termloop_register) {
    window.__termloop_register(id, factory);
  } else {
    const check = setInterval(() => {
      if (typeof window !== "undefined" && window.__termloop_register) {
        clearInterval(check);
        window.__termloop_register(id, factory);
      }
    }, 50);
    setTimeout(() => clearInterval(check), 10_000);
  }
}

// ---------------------------------------------------------------------------
//  Manifest type — for tooling / validation
// ---------------------------------------------------------------------------

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  iconUrl: string;
  bundleUrl: string;
  fileAssociations: string[];
  defaultSize: { width: number; height: number };
  minWidth: number;
  minHeight: number;
  showOnDesktop: boolean;
  showInDock: boolean;
  category: "tools" | "media" | "development" | "utilities" | "other";
}
