'use client';

import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '../typography/empty-state.component';
import { LoadingSkeleton } from '../feedback/loading-skeleton.component';

export type ColunaTabela<T> = {
  chave: string;
  titulo: string;
  render: (item: T) => ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  colunas: ColunaTabela<T>[];
  itens: T[];
  chaveDoItem: (item: T) => string;
  carregando?: boolean;
  mensagemVazia?: string;
  aoClicarNaLinha?: (item: T) => void;
};

export function DataTable<T>({
  colunas,
  itens,
  chaveDoItem,
  carregando,
  mensagemVazia = 'Nenhum registro encontrado',
  aoClicarNaLinha,
}: DataTableProps<T>) {
  if (carregando) return <LoadingSkeleton linhas={6} />;
  if (itens.length === 0) return <EmptyState titulo={mensagemVazia} />;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {colunas.map((coluna) => (
              <TableHead key={coluna.chave} className={coluna.className}>
                {coluna.titulo}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow
              key={chaveDoItem(item)}
              onClick={aoClicarNaLinha ? () => aoClicarNaLinha(item) : undefined}
              className={aoClicarNaLinha ? 'cursor-pointer' : undefined}
            >
              {colunas.map((coluna) => (
                <TableCell key={coluna.chave} className={coluna.className}>
                  {coluna.render(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
