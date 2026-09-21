import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/logo';
import { LogoWithText } from '@/components/shared/logo-with-text';
import { useSidebar } from './sidebar-context';

export function SidebarHeader() {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center',
        collapsed ? 'justify-center px-2' : 'px-4',
      )}
    >
      <Link
        to="/"
        className={cn(
          'flex items-center rounded-lg transition-colors duration-200 hover:opacity-75',
        )}
      >
        {collapsed ? (
          <Logo className="h-8 w-8 text-foreground" />
        ) : (
          <LogoWithText />
        )}
      </Link>
    </div>
  );
}
