'use client';

import { create } from 'zustand';

type UiState = {
  menuMobileAberto: boolean;
  abrirMenuMobile: () => void;
  fecharMenuMobile: () => void;
  /** Filtros globais da agenda (data de referência em fuso da unidade). */
  dataAgenda: string | null;
  definirDataAgenda: (data: string | null) => void;
  visualizacaoAgenda: 'dia' | 'semana';
  definirVisualizacaoAgenda: (visualizacao: 'dia' | 'semana') => void;
};

export const useUiStore = create<UiState>((set) => ({
  menuMobileAberto: false,
  abrirMenuMobile: () => set({ menuMobileAberto: true }),
  fecharMenuMobile: () => set({ menuMobileAberto: false }),
  dataAgenda: null,
  definirDataAgenda: (dataAgenda) => set({ dataAgenda }),
  visualizacaoAgenda: 'dia',
  definirVisualizacaoAgenda: (visualizacaoAgenda) => set({ visualizacaoAgenda }),
}));
