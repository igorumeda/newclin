import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { TipoAtendimento } from '../../../../domain/entities/tipo-atendimento.entity';
import type {
  TipoAtendimentoModel,
  TipoAtendimentoModelData,
} from '../models/tipo-atendimento.model';

export type TipoAtendimentoToDomainParams = ToDomainParams<TipoAtendimentoModel>;
export type TipoAtendimentoToPersistenceParams = ToPersistenceParams<TipoAtendimento>;

export class TipoAtendimentoPersistenceMapper extends PersistenceMapper<
  TipoAtendimento,
  TipoAtendimentoModel,
  TipoAtendimentoModelData
> {
  toDomain({ record }: TipoAtendimentoToDomainParams): TipoAtendimento {
    return TipoAtendimento.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        duracaoMinutos: record.duracao_minutos,
        cor: record.cor,
        ativo: record.ativo,
      },
    });
  }

  toPersistence({ entity }: TipoAtendimentoToPersistenceParams): TipoAtendimentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      duracao_minutos: entity.duracaoMinutos,
      cor: entity.cor,
      ativo: entity.ativo,
    };
  }
}
