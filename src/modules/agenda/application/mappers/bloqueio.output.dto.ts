export type BloqueioOutputDto = {
  id: string;
  redeId: string;
  unidadeId: string;
  profissionalId: string | null;
  motivo: string;
  inicio: string;
  fim: string;
  criadoEm: string;
};
