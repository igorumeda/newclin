'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (tentativas, erro) => {
          // Não insiste em erros de negócio/autenticação.
          const status = (erro as { status?: number })?.status ?? 0;
          if (status >= 400 && status < 500) return false;
          return tentativas < 2;
        },
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ descriptionClassName: 'text-muted-foreground' }}
        />
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
