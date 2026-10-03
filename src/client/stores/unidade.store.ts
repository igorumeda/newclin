'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UnidadeState = {
  /** Unidade ativa no contexto do usuário (§2.2 — `unidades_acesso`). */
  unidadeId: string | null;
  definirUnidade: (unidadeId: string | null) => void;
  limpar: () => void;
};

export const useUnidadeStore = create<UnidadeState>()(
  persist(
    (set) => ({
      unidadeId: null,
      definirUnidade: (unidadeId) => set({ unidadeId }),
      limpar: () => set({ unidadeId: null }),
    }),
    { name: 'clinica.unidade-ativa' },
  ),
);
