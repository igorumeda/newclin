import { Mapper } from '@core/application/mapper.base';
import { Identifier } from '@core/domain/identifier';
import { HorarioAtendimento } from '../../../../domain/entities/horario-atendimento.entity';
import type { HorarioAtendimentoModel } from '../models/profissional.model';

export type HorarioToDomainParams = { record: HorarioAtendimentoModel };

export class HorarioPersistenceMapper extends Mapper<HorarioToDomainParams, HorarioAtendimento> {
  public map({ record }: HorarioToDomainParams): HorarioAtendimento {
    return HorarioAtendimento.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        profissionalId: record.profissional_id,
        unidadeId: record.unidade_id,
        diaSemana: Number(record.dia_semana),
        horaInicio: String(record.hora_inicio).slice(0, 5),
        horaFim: String(record.hora_fim).slice(0, 5),
        ativo: record.ativo,
      },
    });
  }
}
