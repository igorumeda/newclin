import { Result } from '@core/domain/result';
import type { AuditEntryInput, IAuditWriter } from '@/server/middlewares/audit.middleware';
import { RegistrarAuditoriaUseCase } from '../../../application/use-cases/registrar-auditoria/registrar-auditoria.use-case';

export type AuditWriterAdapterDependencies = {
  registrarAuditoria: RegistrarAuditoriaUseCase;
};

/**
 * Anti-Corruption Layer entre o middleware HTTP (server global) e o caso de uso
 * de auditoria (módulo audit). O middleware conhece apenas `IAuditWriter`.
 */
export class AuditWriterAdapter implements IAuditWriter {
  private readonly registrarAuditoria: RegistrarAuditoriaUseCase;

  constructor(dependencies: AuditWriterAdapterDependencies) {
    this.registrarAuditoria = dependencies.registrarAuditoria;
  }

  async write(entry: AuditEntryInput): Promise<Result<void>> {
    const result = await this.registrarAuditoria.execute({
      redeId: entry.redeId,
      usuarioId: entry.userId,
      usuarioNome: entry.userName,
      usuarioEmail: entry.userEmail,
      usuarioRole: entry.userRole,
      unidadeId: entry.unidadeId,
      acao: entry.action,
      entidade: entry.entity,
      registroId: entry.recordId,
      descricao: entry.description,
      dadosAntes: (entry.before ?? null) as Record<string, unknown> | null,
      dadosDepois: (entry.after ?? null) as Record<string, unknown> | null,
      ip: entry.ip,
      userAgent: entry.userAgent,
      origem: 'api',
    });

    if (result.isFailure) return Result.fail(result.error);
    return Result.ok();
  }
}
