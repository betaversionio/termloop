import { Maximize2, Minimize2 } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { useFullscreen } from '@/hooks/use-fullscreen';

export function HeaderActions() {
  const { isFullscreen, toggle } = useFullscreen();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={toggle}
        aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </Button>
      <ThemeToggle />
    </div>
  );
}
