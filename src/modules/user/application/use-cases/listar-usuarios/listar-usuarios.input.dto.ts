export type ListarUsuariosInputDto = {
  redeId: string;
  busca?: string | null;
  role?: string | null;
  ativo?: boolean | null;
  page: number;
  perPage: number;
};
