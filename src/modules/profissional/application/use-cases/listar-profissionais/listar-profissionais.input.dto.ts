export type ListarProfissionaisInputDto = {
  redeId: string;
  busca?: string;
  unidadeId?: string | null;
  apenasAtivos?: boolean;
};
