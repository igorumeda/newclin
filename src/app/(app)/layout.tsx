import { AppShell } from '@/client/components/layout/app-shell';
import { AuthProvider } from '@/client/providers/auth-provider';
import { RedeThemeProvider } from '@/client/providers/rede-theme-provider';

/** Todas as páginas deste grupo exigem sessão — o `middleware.ts` faz o guard. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RedeThemeProvider>
        <AppShell>{children}</AppShell>
      </RedeThemeProvider>
    </AuthProvider>
  );
}
