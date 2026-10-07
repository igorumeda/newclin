import { Mapper } from '@core/application/mapper.base';
import type { Unidade } from '../../domain/entities/unidade.entity';
import type { UnidadeOutputDto } from './unidade.output.dto';

export type MapUnidadeParams = { unidade: Unidade };

export class UnidadeMapper extends Mapper<MapUnidadeParams, UnidadeOutputDto> {
  public map({ unidade }: MapUnidadeParams): UnidadeOutputDto {
    return {
      id: unidade.id.toString(),
      redeId: unidade.redeId,
      nome: unidade.nome,
      codigo: unidade.codigo,
      telefone: unidade.telefone,
      email: unidade.email,
      endereco: unidade.endereco.valores,
      enderecoCompleto: unidade.endereco.completo,
      fusoHorario: unidade.fusoHorario,
      ativo: unidade.ativo,
    };
  }
}
