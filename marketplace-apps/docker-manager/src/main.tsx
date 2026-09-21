import { createApp } from "./App";
import type { AppFactory } from "@termloop/react";

declare global {
  interface Window {
    __termloop_register?: (id: string, factory: AppFactory) => void;
  }
}

window.__termloop_register?.("docker-manager", (sdk) => {
  return { default: createApp(sdk) };
});
