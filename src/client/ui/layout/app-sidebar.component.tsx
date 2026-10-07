'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';
import { NAVEGACAO_PRINCIPAL } from '@/client/config/layout.config';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarItem } from './sidebar-item.component';

export type AppSidebarProps = { redeNome: string; aoNavegar?: () => void };

export function AppSidebar({ redeNome, aoNavegar }: AppSidebarProps) {
  const pathname = usePathname();
  const { pode } = useAutenticacao();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[var(--header-height)] items-center gap-2 border-b border-sidebar-foreground/10 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <span className="truncate">{redeNome}</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-6 p-3" aria-label="Navegação principal">
          {NAVEGACAO_PRINCIPAL.map((grupo) => {
            const itens = grupo.itens.filter((item) => !item.permissao || pode(item.permissao));
            if (itens.length === 0) return null;

            return (
              <div key={grupo.titulo} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {grupo.titulo}
                </p>
                {itens.map((item) => (
                  <SidebarItem
                    key={item.href}
                    titulo={item.titulo}
                    href={item.href}
                    icone={item.icone}
                    ativo={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    aoNavegar={aoNavegar}
                  />
                ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
