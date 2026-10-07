import type { AcaoAuditoria, DadosAuditoria } from '../../domain/entities/registro-auditoria.entity';

export type RegistroAuditoriaResponseDto = {
  id: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  unidadeId: string | null;
  acao: AcaoAuditoria;
  acaoRotulo: string;
  entidade: string;
  entidadeId: string | null;
  descricao: string | null;
  dadosAntes: DadosAuditoria;
  dadosDepois: DadosAuditoria;
  ip: string | null;
  criadoEm: string;
};
