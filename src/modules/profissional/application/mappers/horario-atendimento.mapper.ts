import { Mapper } from '@core/application/mapper.base';
import type { HorarioAtendimento } from '../../domain/entities/horario-atendimento.entity';
import type { HorarioAtendimentoOutputDto } from './profissional.output.dto';

export type MapHorarioParams = { horario: HorarioAtendimento };

export class HorarioAtendimentoMapper extends Mapper<MapHorarioParams, HorarioAtendimentoOutputDto> {
  public map({ horario }: MapHorarioParams): HorarioAtendimentoOutputDto {
    return {
      id: horario.id.toString(),
      profissionalId: horario.profissionalId,
      unidadeId: horario.unidadeId,
      diaSemana: horario.diaSemana,
      rotuloDiaSemana: horario.rotuloDiaSemana,
      horaInicio: horario.horaInicio,
      horaFim: horario.horaFim,
      ativo: horario.ativo,
    };
  }
}
