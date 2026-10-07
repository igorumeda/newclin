import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type InfoCardItem = { rotulo: string; valor: ReactNode };
export type InfoCardProps = { titulo: string; itens: InfoCardItem[]; acoes?: ReactNode };

export function InfoCard({ titulo, itens, acoes }: InfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{titulo}</CardTitle>
        {acoes}
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {itens.map((item) => (
            <div key={item.rotulo} className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.rotulo}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium">{item.valor || '—'}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
