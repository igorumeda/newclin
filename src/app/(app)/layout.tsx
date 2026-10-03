import { AppShell } from '@/client/components/layout/app-shell';

/** Todas as páginas deste grupo exigem sessão — o `middleware.ts` faz o guard. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
