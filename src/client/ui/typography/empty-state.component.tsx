import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn.util';

export type EmptyStateProps = {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  icone?: ReactNode;
  className?: string;
};

export function EmptyState({ titulo, descricao, acao, icone, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center',
        className,
      )}
    >
      {icone ? <div className="text-muted-foreground">{icone}</div> : null}
      <div>
        <p className="font-medium">{titulo}</p>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}
