import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { RegistroAuditoria } from '../../../../domain/entities/registro-auditoria.entity';
import type { AcaoAuditoria } from '../../../../domain/entities/registro-auditoria.entity';
import type { AuditoriaModel, AuditoriaModelData } from '../models/auditoria.model';

export type AuditoriaToDomainParams = ToDomainParams<AuditoriaModel>;
export type AuditoriaToPersistenceParams = ToPersistenceParams<RegistroAuditoria>;

export class AuditoriaPersistenceMapper extends PersistenceMapper<
  RegistroAuditoria,
  AuditoriaModel,
  AuditoriaModelData
> {
  toDomain({ record }: AuditoriaToDomainParams): RegistroAuditoria {
    return RegistroAuditoria.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.created_at },
      props: {
        redeId: record.rede_id,
        usuarioId: record.usuario_id,
        usuarioNome: record.usuario_nome,
        unidadeId: record.unidade_id,
        acao: record.acao as AcaoAuditoria,
        entidade: record.entidade,
        entidadeId: record.entidade_id,
        descricao: record.descricao,
        dadosAntes: record.dados_antes,
        dadosDepois: record.dados_depois,
        ip: record.ip,
        userAgent: record.user_agent,
      },
    });
  }

  toPersistence({ entity }: AuditoriaToPersistenceParams): AuditoriaModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      usuario_id: entity.usuarioId,
      usuario_nome: entity.usuarioNome,
      unidade_id: entity.unidadeId,
      acao: entity.acao,
      entidade: entity.entidade,
      entidade_id: entity.entidadeId,
      descricao: entity.descricao,
      dados_antes: entity.dadosAntes ? JSON.stringify(entity.dadosAntes) : null,
      dados_depois: entity.dadosDepois ? JSON.stringify(entity.dadosDepois) : null,
      ip: entity.ip,
      user_agent: entity.userAgent,
    };
  }
}
