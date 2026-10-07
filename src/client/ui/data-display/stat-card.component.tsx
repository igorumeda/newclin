import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/utils/cn.util';

export type StatCardProps = {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone?: ReactNode;
  className?: string;
};

export function StatCard({ titulo, valor, descricao, icone, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{valor}</p>
          {descricao ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{descricao}</p>
          ) : null}
        </div>
        {icone ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icone}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
