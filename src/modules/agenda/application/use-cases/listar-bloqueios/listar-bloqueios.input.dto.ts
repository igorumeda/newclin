export type ListarBloqueiosInputDto = {
  redeId: string;
  unidadeId?: string | null;
  profissionalId?: string | null;
  inicio: string;
  fim: string;
};
