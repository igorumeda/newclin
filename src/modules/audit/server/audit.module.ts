import type { SupabaseClient } from '@supabase/supabase-js';
import { AuditoriaRepositoryImpl } from './infrastructure/persistence/repositories/auditoria.repository.impl';
import { AuditoriaPersistenceMapper } from './infrastructure/persistence/mappers/auditoria-persistence.mapper';
import { AuditWriterAdapter } from './infrastructure/adapters/audit-writer.adapter';
import { AuditoriaMapper } from '../application/mappers/auditoria.mapper';
import { RegistrarAuditoriaUseCase } from '../application/use-cases/registrar-auditoria/registrar-auditoria.use-case';
import { ListarAuditoriaUseCase } from '../application/use-cases/listar-auditoria/listar-auditoria.use-case';
import { AuditoriaController } from './api/controllers/auditoria.controller';

export type AuditModuleDependencies = {
  supabase: SupabaseClient;
};

export function createAuditModule(dependencies: AuditModuleDependencies) {
  const persistenceMapper = new AuditoriaPersistenceMapper();
  const mapper = new AuditoriaMapper();

  const auditoriaRepository = new AuditoriaRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: persistenceMapper,
  });

  const registrarAuditoria = new RegistrarAuditoriaUseCase({ auditoriaRepository });
  const listarAuditoria = new ListarAuditoriaUseCase({ auditoriaRepository, mapper });

  const writer = new AuditWriterAdapter({ registrarAuditoria });
  const controller = new AuditoriaController({ listarAuditoria });

  return {
    controller,
    writer,
    repositories: { auditoriaRepository },
    useCases: { registrarAuditoria, listarAuditoria },
  };
}

export type AuditModule = ReturnType<typeof createAuditModule>;
