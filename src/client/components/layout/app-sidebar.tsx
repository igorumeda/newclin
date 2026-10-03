'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { cn } from '@/client/lib/utils';
import { useAuth } from '@/client/providers/auth-provider';
import { useOrganizacao } from '@/client/hooks/use-organizacao';
import { NAVEGACAO, ROTULOS_GRUPO, type ItemNavegacao } from './navegacao';

type AppSidebarProps = {
  aoNavegar?: () => void;
  className?: string;
};

const ORDEM_GRUPOS: ItemNavegacao['grupo'][] = ['operacao', 'clinico', 'gestao'];

export function AppSidebar({ aoNavegar, className }: AppSidebarProps) {
  const caminho = usePathname();
  const { pode } = useAuth();
  const { organizacao } = useOrganizacao();

  const itens = NAVEGACAO.filter((item) => !item.permissao || pode(item.permissao));
  const rede = organizacao;

  return (
    <aside className={cn('flex h-full w-64 flex-col border-r bg-card', className)}>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        {rede?.logotipoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rede.logotipoUrl} alt={rede.nome} className="size-9 rounded-md object-contain" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{rede?.nome ?? 'Clínica'}</p>
          <p className="truncate text-xs text-muted-foreground">Gestão clínica</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Navegação principal">
        {ORDEM_GRUPOS.map((grupo) => {
          const itensGrupo = itens.filter((item) => item.grupo === grupo);
          if (itensGrupo.length === 0) return null;

          return (
            <div key={grupo} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {ROTULOS_GRUPO[grupo]}
              </p>
              {itensGrupo.map((item) => {
                const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
                const Icone = item.icone;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={aoNavegar}
                    aria-current={ativo ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      ativo ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icone className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.titulo}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t p-3 text-[11px] text-muted-foreground">
        <p>Clínica SaaS v1.0</p>
      </div>
    </aside>
  );
}
