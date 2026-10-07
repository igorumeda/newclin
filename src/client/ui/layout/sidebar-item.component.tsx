'use client';

import Link from 'next/link';
import { cn } from '@/shared/utils/cn.util';
import { Icon } from './icon.component';

export type SidebarItemProps = {
  titulo: string;
  href: string;
  icone: string;
  ativo: boolean;
  aoNavegar?: () => void;
};

export function SidebarItem({ titulo, href, icone, ativo, aoNavegar }: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={aoNavegar}
      aria-current={ativo ? 'page' : undefined}
      className={cn(
        'flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ativo
          ? 'bg-primary text-primary-foreground'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground',
      )}
    >
      <Icon nome={icone} className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{titulo}</span>
    </Link>
  );
}
