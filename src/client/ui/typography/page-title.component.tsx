import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn.util';

export type PageTitleProps = {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
};

export function PageTitle({ titulo, descricao, acoes, className }: PageTitleProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acoes ? <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div> : null}
    </div>
  );
}
