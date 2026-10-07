export type AtualizarTipoAtendimentoInputDto = {
  redeId: string;
  id: string;
  nome?: string;
  duracaoMinutos?: number;
  cor?: string;
  ativo?: boolean;
};
