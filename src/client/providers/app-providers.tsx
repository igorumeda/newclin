'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { SessaoUsuario } from '@/modules/auth/client/services/auth-api.service';
import type { VariaveisTema } from '@/client/config/theme.config';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { TemaRedeProvider } from './tema-rede-provider';
import { ThemeProvider } from './theme-provider';

export type AppProvidersProps = {
  usuario: SessaoUsuario | null;
  coresRede: VariaveisTema | null;
  children: ReactNode;
};

export function AppProviders({ usuario, coresRede, children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider usuario={usuario}>
          <TemaRedeProvider cores={coresRede}>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <Toaster />
          </TemaRedeProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
