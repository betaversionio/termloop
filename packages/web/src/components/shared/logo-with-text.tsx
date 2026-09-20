import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';

interface LogoWithTextProps {
  logoClassName?: string;
  textClassName?: string;
  className?: string;
}

export function LogoWithText({
  logoClassName,
  textClassName,
  className,
}: LogoWithTextProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Logo className={cn('h-8 w-8 text-foreground', logoClassName)} />
      <span
        className={cn('text-lg font-semibold tracking-tight', textClassName)}
      >
        TermLoop
      </span>
    </div>
  );
}
