'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { aplicarTema } from '@/client/config/theme.config';
import type { VariaveisTema } from '@/client/config/theme.config';

export type TemaRedeProviderProps = { cores: VariaveisTema | null; children: ReactNode };

/** Aplica o tema da rede em tempo real, sem recarregar a página (spec §3.7). */
export function TemaRedeProvider({ cores, children }: TemaRedeProviderProps) {
  useEffect(() => {
    if (cores) aplicarTema({ cores });
  }, [cores]);

  return <>{children}</>;
}
