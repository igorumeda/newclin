'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/client/lib/utils';
import { Button } from './button';
import { Skeleton } from './feedback';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export type PaginacaoServidor = {
  page: number;
  perPage: number;
  total: number;
  aoMudarPagina: (page: number) => void;
};

export type DataTableProps<T> = {
  colunas: ColumnDef<T, unknown>[];
  dados: T[];
  carregando?: boolean;
  paginacaoServidor?: PaginacaoServidor;
  ordenacaoInicial?: SortingState;
  estadoVazio?: React.ReactNode;
  aoClicarLinha?: (linha: T) => void;
  /** Linha destacada (ex.: paciente/atendimento selecionado). */
  linhaSelecionada?: (linha: T) => boolean;
  className?: string;
};

export function DataTable<T>({
  colunas,
  dados,
  carregando = false,
  paginacaoServidor,
  ordenacaoInicial = [],
  estadoVazio,
  aoClicarLinha,
  linhaSelecionada,
  className,
}: DataTableProps<T>) {
  const [ordenacao, setOrdenacao] = React.useState<SortingState>(ordenacaoInicial);

  const table = useReactTable({
    data: dados,
    columns: colunas,
    state: { sorting: ordenacao },
    onSortingChange: setOrdenacao,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: Boolean(paginacaoServidor),
    manualSorting: Boolean(paginacaoServidor),
  });

  const totalPaginas = paginacaoServidor
    ? Math.max(1, Math.ceil(paginacaoServidor.total / paginacaoServidor.perPage))
    : 1;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id} className="hover:bg-transparent">
                {grupo.headers.map((header) => {
                  const podeOrdenar = header.column.getCanSort();
                  const ordenada = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() ? header.getSize() : undefined }}>
                      {header.isPlaceholder ? null : podeOrdenar && !paginacaoServidor ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {ordenada === 'asc' ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : ordenada === 'desc' ? (
                            <ArrowDown className="size-3" aria-hidden />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" aria-hidden />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {carregando ? (
              Array.from({ length: 5 }).map((_, indice) => (
                <TableRow key={`skeleton-${indice}`}>
                  {colunas.map((_, indiceColuna) => (
                    <TableCell key={`skeleton-${indice}-${indiceColuna}`}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colunas.length} className="py-10 text-center text-sm text-muted-foreground">
                  {estadoVazio ?? 'Nenhum registro encontrado.'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((linha) => (
                <TableRow
                  key={linha.id}
                  data-selecionada={linhaSelecionada?.(linha.original) ? 'true' : undefined}
                  onClick={aoClicarLinha ? () => aoClicarLinha(linha.original) : undefined}
                  className={aoClicarLinha ? 'cursor-pointer' : undefined}
                >
                  {linha.getVisibleCells().map((celula) => (
                    <TableCell key={celula.id}>
                      {flexRender(celula.column.columnDef.cell, celula.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginacaoServidor ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {paginacaoServidor.total === 0
              ? 'Nenhum registro'
              : `${(paginacaoServidor.page - 1) * paginacaoServidor.perPage + 1}–${Math.min(
                  paginacaoServidor.page * paginacaoServidor.perPage,
                  paginacaoServidor.total,
                )} de ${paginacaoServidor.total}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => paginacaoServidor.aoMudarPagina(paginacaoServidor.page - 1)}
              disabled={paginacaoServidor.page <= 1 || carregando}
            >
              <ChevronLeft aria-hidden />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {paginacaoServidor.page} / {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => paginacaoServidor.aoMudarPagina(paginacaoServidor.page + 1)}
              disabled={paginacaoServidor.page >= totalPaginas || carregando}
            >
              Próxima
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
