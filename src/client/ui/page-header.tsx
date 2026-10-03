import * as React from 'react';
import { cn } from '@/client/lib/utils';

export type PageHeaderProps = {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/** Cabeçalho padrão das páginas: título, descrição e ações à direita. */
export function PageHeader({ titulo, descricao, acoes, className, children }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{titulo}</h1>
        {descricao ? <p className="max-w-2xl text-sm text-muted-foreground">{descricao}</p> : null}
        {children}
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
    </div>
  );
}

export type StatCardProps = {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone?: React.ElementType;
  variacao?: { valor: string; positiva: boolean };
  className?: string;
};

/** Cartão de indicador usado em dashboard e relatórios. */
export function StatCard({ titulo, valor, descricao, icone: Icone, variacao, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm sm:p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
        {Icone ? <Icone className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{valor}</p>
      <div className="mt-1 flex items-center gap-2">
        {variacao ? (
          <span
            className={cn(
              'text-xs font-medium',
              variacao.positiva ? 'text-success' : 'text-destructive',
            )}
          >
            {variacao.valor}
          </span>
        ) : null}
        {descricao ? <span className="text-xs text-muted-foreground">{descricao}</span> : null}
      </div>
    </div>
  );
}
