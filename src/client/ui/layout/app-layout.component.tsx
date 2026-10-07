import type { ReactNode } from 'react';
import { AppFooter } from './app-footer.component';
import { AppHeader } from './app-header.component';
import { AppSidebar } from './app-sidebar.component';

export type AppLayoutProps = { redeNome: string; appNome: string; children: ReactNode };

/** Shell do sistema: sidebar sticky em flex row (nunca fixed sobreposto). */
export function AppLayout({ redeNome, appNome, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[var(--sidebar-width)] shrink-0 lg:block">
        <AppSidebar redeNome={redeNome} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader redeNome={redeNome} />
        <main className="min-w-0 flex-1">{children}</main>
        <AppFooter appNome={appNome} />
      </div>
    </div>
  );
}
