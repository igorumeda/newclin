export type ListarUnidadesInputDto = {
  redeId: string;
  busca?: string;
  apenasAtivas?: boolean;
  unidadesPermitidas?: string[] | null;
};
