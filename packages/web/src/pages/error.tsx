import { useNavigate } from "@tanstack/react-router";
import { Danger } from "iconsax-react";
import { Button } from "@/components/ui/button";

export function ErrorPage({ error }: { error: unknown }) {
  const navigate = useNavigate();

  const message = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <Danger size={56} color="currentColor" variant="Linear" className="text-destructive/60 mb-6" />
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
        <Button onClick={() => navigate({ to: "/" })}>
          Back to Servers
        </Button>
      </div>
    </div>
  );
}
