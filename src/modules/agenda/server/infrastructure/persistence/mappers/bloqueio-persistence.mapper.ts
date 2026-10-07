import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { BloqueioAgenda } from '../../../../domain/entities/bloqueio-agenda.entity';
import { Periodo } from '../../../../domain/value-objects/periodo.vo';
import type { BloqueioModel, BloqueioModelData } from '../models/bloqueio.model';

export type BloqueioToDomainParams = ToDomainParams<BloqueioModel>;
export type BloqueioToPersistenceParams = ToPersistenceParams<BloqueioAgenda>;

export class BloqueioPersistenceMapper extends PersistenceMapper<
  BloqueioAgenda,
  BloqueioModel,
  BloqueioModelData
> {
  toDomain({ record }: BloqueioToDomainParams): BloqueioAgenda {
    return BloqueioAgenda.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        profissionalId: record.profissional_id,
        motivo: record.motivo,
        periodo: Periodo.reconstitute({
          inicio: new Date(record.data_hora_inicio),
          fim: new Date(record.data_hora_fim),
        }),
        criadoPor: record.criado_por,
      },
    });
  }

  toPersistence({ entity }: BloqueioToPersistenceParams): BloqueioModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      profissional_id: entity.profissionalId,
      motivo: entity.motivo,
      data_hora_inicio: entity.periodo.inicio,
      data_hora_fim: entity.periodo.fim,
      criado_por: entity.criadoPor,
    };
  }
}
