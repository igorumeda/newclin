export type ListarPacientesInputDto = {
  redeId: string;
  busca?: string;
  apenasAtivos?: boolean;
  page?: number;
  perPage?: number;
};
