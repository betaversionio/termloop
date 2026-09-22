import React, { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request, BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { openFilePicker } from "@/hooks/use-file-picker";
import { useTheme } from "@/components/theme-provider";
import { useWindowManager } from "@/features/servers/os/context/window-manager-context";
import { useDesktopSettings } from "@/features/servers/os/context/desktop-settings-context";
import type { RemoteFile, ServerConnection, ServerStats, ApiResponse } from "@termloop/shared";
import type { TermLoopSDK, UseWindowResult, UseOSResult } from "@termloop/react";

export type { MarketplaceAppProps, WidgetProps, TermLoopSDK } from "@termloop/react";

// ---------------------------------------------------------------------------
//  Domain hooks — real implementations that wrap the TermLoop server API
// ---------------------------------------------------------------------------

function useConnectionHook(connectionId: string) {
  const query = useQuery<ServerConnection>({
    queryKey: ["connections", connectionId],
    queryFn: async () => {
      const res = await request<ServerConnection>(`/connections/${connectionId}`);
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch connection");
      return res.data;
    },
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

function useSFTPHook(connectionId: string) {
  const queryClient = useQueryClient();

  const list = useCallback(
    async (path: string) => {
      const res = await request<RemoteFile[]>(
        `/sftp/${connectionId}/list?path=${encodeURIComponent(path)}`
      );
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to list directory");
      return res.data;
    },
    [connectionId]
  );

  const read = useCallback(
    async (path: string) => {
      const res = await request<{ content: string }>(
        `/sftp/${connectionId}/read?path=${encodeURIComponent(path)}`
      );
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to read file");
      return res.data.content;
    },
    [connectionId]
  );

  const write = useCallback(
    async (path: string, content: string) => {
      const res = await request(
        `/sftp/${connectionId}/write`,
        { method: "POST", body: JSON.stringify({ path, content }) }
      );
      if (!res.success) throw new Error(res.error ?? "Failed to write file");
    },
    [connectionId]
  );

  const downloadUrl = useCallback(
    (path: string) =>
      `http://localhost:3721${BASE}/sftp/${connectionId}/download?path=${encodeURIComponent(path)}`,
    [connectionId]
  );

  const upload = useCallback(
    async (dirPath: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `http://localhost:3721${BASE}/sftp/${connectionId}/upload?path=${encodeURIComponent(dirPath)}`,
        { method: "POST", body: formData }
      );
      const json = (await res.json()) as ApiResponse;
      if (!json.success) throw new Error(json.error ?? "Failed to upload file");
    },
    [connectionId]
  );

  const remove = useCallback(
    async (path: string, isDir = false) => {
      const res = await request(
        `/sftp/${connectionId}/delete?path=${encodeURIComponent(path)}&isDir=${isDir}`,
        { method: "DELETE" }
      );
      if (!res.success) throw new Error(res.error ?? "Failed to delete");
    },
    [connectionId]
  );

  const rename = useCallback(
    async (oldPath: string, newPath: string) => {
      const res = await request(
        `/sftp/${connectionId}/rename`,
        { method: "POST", body: JSON.stringify({ oldPath, newPath }) }
      );
      if (!res.success) throw new Error(res.error ?? "Failed to rename");
    },
    [connectionId]
  );

  const mkdir = useCallback(
    async (path: string) => {
      const res = await request(
        `/sftp/${connectionId}/mkdir`,
        { method: "POST", body: JSON.stringify({ path }) }
      );
      if (!res.success) throw new Error(res.error ?? "Failed to create directory");
    },
    [connectionId]
  );

  const invalidate = useCallback(
    (path?: string) => {
      if (path) {
        queryClient.invalidateQueries({ queryKey: ["sftp", connectionId, path] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["sftp", connectionId] });
      }
    },
    [connectionId, queryClient]
  );

  return useMemo(
    () => ({ list, read, write, downloadUrl, upload, remove, rename, mkdir, invalidate }),
    [list, read, write, downloadUrl, upload, remove, rename, mkdir, invalidate]
  );
}

function useSSHHook(connectionId: string) {
  const execute = useCallback(
    async (command: string) => {
      const res = await request<{ stdout: string; stderr: string; code: number }>(
        `/ssh/${connectionId}/exec`,
        { method: "POST", body: JSON.stringify({ command }) }
      );
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to execute command");
      return res.data;
    },
    [connectionId]
  );

  return useMemo(() => ({ execute }), [execute]);
}

function useStatsHook(connectionId: string) {
  const query = useQuery<ServerStats>({
    queryKey: ["stats", connectionId],
    queryFn: async () => {
      const res = await request<ServerStats>(`/stats/${connectionId}`);
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to fetch stats");
      return res.data;
    },
    refetchInterval: 5000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function useFileListHook(connectionId: string, path: string) {
  const query = useQuery<RemoteFile[]>({
    queryKey: ["sftp", connectionId, path],
    queryFn: async () => {
      const res = await request<RemoteFile[]>(
        `/sftp/${connectionId}/list?path=${encodeURIComponent(path)}`
      );
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to list directory");
      return res.data;
    },
  });

  return {
    files: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function useWindowHook(windowId: string): UseWindowResult {
  const { state, dispatch } = useWindowManager();
  const win = state.windows.find((w) => w.id === windowId);

  const activeId = useMemo(() => {
    const visible = state.windows.filter((w) => !w.minimized);
    return visible.sort((a, b) => b.zIndex - a.zIndex)[0]?.id;
  }, [state.windows]);

  const setTitle = useCallback(
    (title: string) => dispatch({ type: "RENAME", id: windowId, title }),
    [dispatch, windowId]
  );
  const close = useCallback(() => dispatch({ type: "CLOSE", id: windowId }), [dispatch, windowId]);
  const focus = useCallback(() => dispatch({ type: "FOCUS", id: windowId }), [dispatch, windowId]);
  const minimize = useCallback(() => dispatch({ type: "MINIMIZE", id: windowId }), [dispatch, windowId]);
  const maximize = useCallback(() => dispatch({ type: "MAXIMIZE", id: windowId }), [dispatch, windowId]);
  const restore = useCallback(() => dispatch({ type: "RESTORE", id: windowId }), [dispatch, windowId]);
  const resize = useCallback(
    (bounds: { width?: number; height?: number }) => dispatch({ type: "RESIZE", id: windowId, bounds }),
    [dispatch, windowId]
  );

  return useMemo(
    () => ({
      title: win?.title ?? "",
      setTitle,
      isFocused: activeId === windowId,
      isMaximized: win?.maximized ?? false,
      isMinimized: win?.minimized ?? false,
      close,
      focus,
      minimize,
      maximize,
      restore,
      resize,
    }),
    [win, activeId, windowId, setTitle, close, focus, minimize, maximize, restore, resize]
  );
}

function useOSHook(): UseOSResult {
  const { theme, setTheme } = useTheme();
  const { wallpaper, setWallpaper } = useDesktopSettings();

  return useMemo(
    () => ({ theme, setTheme, wallpaper, setWallpaper, version: __APP_VERSION__ }),
    [theme, setTheme, wallpaper, setWallpaper]
  );
}

// ---------------------------------------------------------------------------
//  Build the SDK object
// ---------------------------------------------------------------------------

export function buildSDK(): TermLoopSDK {
  return {
    React,
    hooks: {
      useConnection: useConnectionHook,
      useSFTP: useSFTPHook,
      useSSH: useSSHHook,
      useStats: useStatsHook,
      useFileList: useFileListHook,
      useQuery,
      useMutation,
      useWindow: useWindowHook,
      useOS: useOSHook,
    },
    ui: {
      Button,
      Input,
      Select,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectItem,
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
      Tabs,
      TabsList,
      TabsTrigger,
      TabsContent,
      Badge,
      Spinner,
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
      DialogTrigger,
      DialogClose,
      Separator,
      toast,
      pickFile: openFilePicker,
    },
    utils: {
      cn,
      request,
    },
  };
}
