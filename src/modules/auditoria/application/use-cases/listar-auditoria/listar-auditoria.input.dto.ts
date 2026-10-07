import type { AcaoAuditoria } from '../../../domain/entities/registro-auditoria.entity';

export type ListarAuditoriaInputDto = {
  redeId: string;
  usuarioId?: string | null;
  entidade?: string | null;
  entidadeId?: string | null;
  acao?: AcaoAuditoria | null;
  de?: string | null;
  ate?: string | null;
  pagina?: number;
  porPagina?: number;
};
