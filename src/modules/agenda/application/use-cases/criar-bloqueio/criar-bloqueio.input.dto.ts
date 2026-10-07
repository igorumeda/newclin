export type CriarBloqueioInputDto = {
  redeId: string;
  unidadeId: string;
  profissionalId?: string | null;
  motivo: string;
  inicio: string;
  fim: string;
  criadoPor?: string | null;
};
