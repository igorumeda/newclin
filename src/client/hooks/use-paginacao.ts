'use client';

import { useCallback, useState } from 'react';

export type UsePaginacaoResult = {
  page: number;
  perPage: number;
  irPara: (page: number) => void;
  definirPerPage: (perPage: number) => void;
  reiniciar: () => void;
};

/** Estado de paginação para listagens paginadas no servidor. */
export function usePaginacao(perPageInicial = 20): UsePaginacaoResult {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(perPageInicial);

  const irPara = useCallback((novaPagina: number) => setPage(Math.max(1, novaPagina)), []);
  const reiniciar = useCallback(() => setPage(1), []);

  const definirPerPage = useCallback((novo: number) => {
    setPerPage(novo);
    setPage(1);
  }, []);

  return { page, perPage, irPara, definirPerPage, reiniciar };
}
