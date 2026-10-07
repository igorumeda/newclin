import { Mapper } from '@core/application/mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Adendo } from '../../../../domain/entities/adendo.entity';
import type { AdendoModel } from '../models/atendimento.model';

export type AdendoToDomainParams = { record: AdendoModel };

export class AdendoPersistenceMapper extends Mapper<AdendoToDomainParams, Adendo> {
  public map({ record }: AdendoToDomainParams): Adendo {
    return Adendo.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.created_at },
      props: {
        redeId: record.rede_id,
        atendimentoId: record.atendimento_id,
        profissionalId: record.profissional_id,
        usuarioId: record.usuario_id,
        conteudo: record.conteudo,
      },
    });
  }
}
