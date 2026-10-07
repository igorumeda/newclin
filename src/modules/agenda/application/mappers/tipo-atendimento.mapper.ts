import { Mapper } from '@core/application/mapper.base';
import type { TipoAtendimento } from '../../domain/entities/tipo-atendimento.entity';
import type { TipoAtendimentoOutputDto } from './tipo-atendimento.output.dto';

export type TipoAtendimentoMapperParams = { tipoAtendimento: TipoAtendimento };

export class TipoAtendimentoMapper extends Mapper<
  TipoAtendimentoMapperParams,
  TipoAtendimentoOutputDto
> {
  public map({ tipoAtendimento }: TipoAtendimentoMapperParams): TipoAtendimentoOutputDto {
    return {
      id: tipoAtendimento.id.toString(),
      redeId: tipoAtendimento.redeId,
      nome: tipoAtendimento.nome,
      duracaoMinutos: tipoAtendimento.duracaoMinutos,
      cor: tipoAtendimento.cor,
      ativo: tipoAtendimento.ativo,
      criadoEm: tipoAtendimento.createdAt.toISOString(),
      atualizadoEm: tipoAtendimento.updatedAt.toISOString(),
    };
  }
}
