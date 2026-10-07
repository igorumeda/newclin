import type { DadosAuditoria } from '../../../domain/entities/registro-auditoria.entity';

export type RegistrarEventoAuditoriaInputDto = {
  redeId: string;
  usuarioId?: string | null;
  usuarioNome?: string | null;
  unidadeId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  descricao?: string | null;
  dadosAntes?: DadosAuditoria;
  dadosDepois?: DadosAuditoria;
  ip?: string | null;
  userAgent?: string | null;
};
