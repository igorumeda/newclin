import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn.util';

export type SectionTitleProps = {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
};

export function SectionTitle({ titulo, descricao, acoes, className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
        {descricao ? <p className="text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acoes}
    </div>
  );
}
