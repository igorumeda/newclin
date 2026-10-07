export type RegistrarAcessoProntuarioInputDto = {
  redeId: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  pacienteId: string;
  atendimentoId?: string | null;
  unidadeId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};
