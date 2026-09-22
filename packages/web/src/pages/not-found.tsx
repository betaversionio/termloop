import { useNavigate } from "@tanstack/react-router";
import { SearchStatus } from "iconsax-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <SearchStatus size={56} color="currentColor" variant="Linear" className="text-muted-foreground/40 mb-6" />
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
        Back to Servers
      </Button>
    </div>
  );
}
