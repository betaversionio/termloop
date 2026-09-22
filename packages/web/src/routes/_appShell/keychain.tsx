import { createFileRoute } from "@tanstack/react-router";
import { KeychainPage } from "@/pages/keychain";

export const Route = createFileRoute("/_appShell/keychain")({
  component: KeychainPage,
});
