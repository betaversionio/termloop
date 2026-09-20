import { BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-muted-foreground"
      >
        <a
          href="https://termloop.betaversion.io/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BookOpen size={16} />
          Docs
        </a>
      </Button>
      <ThemeToggle />
    </div>
  );
}
