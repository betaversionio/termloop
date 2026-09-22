import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Danger } from "iconsax-react";
import { Button } from "@/components/ui/button";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let message = "An unexpected error occurred. Please try again.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} — ${error.statusText}`;
    message = error.data?.message || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <Danger size={56} color="currentColor" variant="Linear" className="text-destructive/60 mb-6" />
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{message}</p>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => navigate(0)}>
          Try Again
        </Button>
        <Button onClick={() => navigate("/")}>
          Back to Servers
        </Button>
      </div>
    </div>
  );
}
