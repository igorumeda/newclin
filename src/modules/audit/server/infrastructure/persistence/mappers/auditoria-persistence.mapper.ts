import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Auditoria } from '../../../../domain/entities/auditoria.entity';
import { AcaoAuditoria } from '../../../../domain/value-objects/acao-auditoria.vo';
import type { AcaoAuditoriaValue } from '../../../../domain/value-objects/acao-auditoria.vo';
import type { AuditLogModel, AuditLogModelData } from '../models/audit-log.model';

export type AuditoriaToDomainParams = ToDomainParams<AuditLogModel>;
export type AuditoriaToPersistenceParams = ToPersistenceParams<Auditoria>;

export class AuditoriaPersistenceMapper extends PersistenceMapper<
  Auditoria,
  AuditLogModel,
  AuditLogModelData
> {
  public toDomain({ record }: AuditoriaToDomainParams): Auditoria {
    return Auditoria.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.created_at),
      props: {
        redeId: record.rede_id,
        usuarioId: record.user_id,
        usuarioNome: record.user_nome,
        usuarioEmail: record.user_email,
        usuarioRole: record.user_role,
        unidadeId: record.unidade_id,
        acao: AcaoAuditoria.reconstitute(record.acao as AcaoAuditoriaValue),
        entidade: record.entidade,
        registroId: record.registro_id,
        descricao: record.descricao,
        dadosAntes: record.dados_antes,
        dadosDepois: record.dados_depois,
        ip: record.ip,
        userAgent: record.user_agent,
        origem: record.origem,
      },
    });
  }

  public toPersistence({ entity }: AuditoriaToPersistenceParams): AuditLogModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      user_id: entity.usuarioId,
      user_nome: entity.usuarioNome,
      user_email: entity.usuarioEmail,
      user_role: entity.usuarioRole,
      unidade_id: entity.unidadeId,
      acao: entity.acao.value,
      entidade: entity.entidade,
      registro_id: entity.registroId,
      descricao: entity.descricao,
      dados_antes: entity.dadosAntes,
      dados_depois: entity.dadosDepois,
      ip: entity.ip,
      user_agent: entity.userAgent,
      origem: entity.origem,
    };
  }
}
