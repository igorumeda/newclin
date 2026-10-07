export type AdicionarAdendoInputDto = {
  redeId: string;
  atendimentoId: string;
  profissionalId: string;
  usuarioId?: string | null;
  conteudo: string;
};
