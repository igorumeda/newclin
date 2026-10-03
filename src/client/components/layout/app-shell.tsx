'use client';

import * as React from 'react';
import { cn } from '@/client/lib/utils';
import { useAuth } from '@/client/providers/auth-provider';
import { useUiStore } from '@/client/stores/ui.store';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

/** Estrutura padrão das páginas autenticadas: barra lateral + cabeçalho + conteúdo. */
export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const { menuMobileAberto, fecharMenuMobile } = useUiStore();
  const { carregando, perfil } = useAuth();

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
          <AppSidebar />
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
            <AppSidebar aoNavegar={fecharMenuMobile} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
