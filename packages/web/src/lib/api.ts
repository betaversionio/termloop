import type { ApiResponse } from "@termloop/shared";

export const BASE = "/api";

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`http://localhost:3721${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}
