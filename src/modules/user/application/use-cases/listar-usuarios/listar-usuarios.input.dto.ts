export type ListarUsuariosInputDto = {
  redeId: string | null;
  busca?: string | null;
  role?: string | null;
  ativo?: boolean | null;
  page: number;
  perPage: number;
};
