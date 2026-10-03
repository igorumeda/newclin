export type RegistrarAuditoriaInputDto = {
  redeId: string;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  usuarioEmail?: string | null;
  usuarioRole?: string | null;
  unidadeId?: string | null;
  acao: string;
  entidade: string;
  registroId?: string | null;
  descricao?: string | null;
  dadosAntes?: Record<string, unknown> | null;
  dadosDepois?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  origem?: string;
};
