import { Mapper } from '@core/application/mapper.base';
import type { Adendo } from '../../domain/entities/adendo.entity';
import type { AdendoOutputDto } from './atendimento.output.dto';

export type AdendoMapperParams = { adendo: Adendo };

export class AdendoMapper extends Mapper<AdendoMapperParams, AdendoOutputDto> {
  public map({ adendo }: AdendoMapperParams): AdendoOutputDto {
    return {
      id: adendo.id.toString(),
      atendimentoId: adendo.atendimentoId,
      profissionalId: adendo.profissionalId,
      conteudo: adendo.conteudo,
      criadoEm: adendo.createdAt.toISOString(),
    };
  }
}
