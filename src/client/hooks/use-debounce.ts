'use client';

import { useEffect, useState } from 'react';

/** Aguarda o usuário parar de digitar antes de disparar a busca (§3.3). */
export function useDebounce<T>(valor: T, atrasoMs = 400): T {
  const [valorDebounced, setValorDebounced] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setValorDebounced(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);

  return valorDebounced;
}
