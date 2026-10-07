'use client';

import { useEffect, useState } from 'react';

export type UseDebounceParams<T> = { valor: T; atrasoMs?: number };

export function useDebounce<T>({ valor, atrasoMs = 350 }: UseDebounceParams<T>): T {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);

  return debounced;
}
