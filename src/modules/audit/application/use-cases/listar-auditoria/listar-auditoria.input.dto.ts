export type ListarAuditoriaInputDto = {
  redeId: string;
  entidade?: string | null;
  acao?: string | null;
  usuarioId?: string | null;
  registroId?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  page: number;
  perPage: number;
};
