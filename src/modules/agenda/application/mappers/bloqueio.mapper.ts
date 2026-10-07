import { Mapper } from '@core/application/mapper.base';
import type { BloqueioAgenda } from '../../domain/entities/bloqueio-agenda.entity';
import type { BloqueioOutputDto } from './bloqueio.output.dto';

export type BloqueioMapperParams = { bloqueio: BloqueioAgenda };

export class BloqueioMapper extends Mapper<BloqueioMapperParams, BloqueioOutputDto> {
  public map({ bloqueio }: BloqueioMapperParams): BloqueioOutputDto {
    return {
      id: bloqueio.id.toString(),
      redeId: bloqueio.redeId,
      unidadeId: bloqueio.unidadeId,
      profissionalId: bloqueio.profissionalId,
      motivo: bloqueio.motivo,
      inicio: bloqueio.periodo.inicio.toISOString(),
      fim: bloqueio.periodo.fim.toISOString(),
      criadoEm: bloqueio.createdAt.toISOString(),
    };
  }
}
