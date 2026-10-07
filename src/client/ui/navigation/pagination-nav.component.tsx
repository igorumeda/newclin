'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PaginationNavProps = {
  pagina: number;
  totalPaginas: number;
  total: number;
  aoMudarPagina: (pagina: number) => void;
};

export function PaginationNav({
  pagina,
  totalPaginas,
  total,
  aoMudarPagina,
}: PaginationNavProps) {
  if (totalPaginas <= 1) {
    return <p className="text-sm text-muted-foreground">{total} registro(s)</p>;
  }

  return (
    <nav
      className="flex items-center justify-between gap-4"
      aria-label="Navegação entre páginas"
    >
      <p className="text-sm text-muted-foreground">
        Página {pagina} de {totalPaginas} — {total} registro(s)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagina <= 1}
          onClick={() => aoMudarPagina(pagina - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pagina >= totalPaginas}
          onClick={() => aoMudarPagina(pagina + 1)}
        >
          Próxima
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
