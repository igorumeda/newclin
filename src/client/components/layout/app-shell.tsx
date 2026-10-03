'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/client/lib/utils';
import { useAuth } from '@/client/providers/auth-provider';
import { useUiStore } from '@/client/stores/ui.store';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import type { NavigationHref, SidebarNavigateHandler } from './app-sidebar';
import { NAVEGACAO } from './navegacao';
import { PageLoading } from './page-loading';

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Estrutura padrão das páginas autenticadas: barra lateral + cabeçalho + conteúdo. */
export function AppShell({ children, className }: AppShellProps) {
  const router = useRouter();
  const caminho = usePathname();
  const [navegando, iniciarNavegacao] = React.useTransition();
  const [destino, definirDestino] = React.useState<NavigationHref | null>(null);
  const { menuMobileAberto, fecharMenuMobile } = useUiStore();
  const { carregando, perfil } = useAuth();
  const aoNavegar: SidebarNavigateHandler = (href) => {
    fecharMenuMobile();
    if (href === caminho && !navegando) return;
    definirDestino(href);
    iniciarNavegacao(() => router.push(href));
  };
  const caminhoAtivo = navegando && destino ? destino : caminho;
  const tituloDestino = NAVEGACAO.find((item) => item.href === caminhoAtivo)?.titulo;

  if (carregando || !perfil) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <span
            className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          Carregando…
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-screen bg-muted/30', className)}>
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar aoNavegar={aoNavegar} caminhoAtivo={caminhoAtivo} />
        </div>
      </div>

      {menuMobileAberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60"
            onClick={fecharMenuMobile}
          />
          <div className="absolute inset-y-0 left-0">
            <AppSidebar aoNavegar={aoNavegar} caminhoAtivo={caminhoAtivo} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="min-w-0 flex-1 p-3 sm:p-5">
          {navegando ? <PageLoading titulo={tituloDestino} /> : children}
        </main>
      </div>
    </div>
  );
}
