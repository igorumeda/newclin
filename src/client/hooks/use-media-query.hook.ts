'use client';

import { useEffect, useState } from 'react';

export type UseMediaQueryParams = { query: string };

export function useMediaQuery({ query }: UseMediaQueryParams): boolean {
  const [combina, setCombina] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setCombina(media.matches);

    const aoMudar = (evento: MediaQueryListEvent): void => setCombina(evento.matches);
    media.addEventListener('change', aoMudar);
    return () => media.removeEventListener('change', aoMudar);
  }, [query]);

  return combina;
}
