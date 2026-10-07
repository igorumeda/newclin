import { Mapper } from '@core/application/mapper.base';
import type { Profissional } from '../../domain/entities/profissional.entity';
import type { ProfissionalOutputDto } from './profissional.output.dto';

export type MapProfissionalParams = { profissional: Profissional };

export class ProfissionalMapper extends Mapper<MapProfissionalParams, ProfissionalOutputDto> {
  public map({ profissional }: MapProfissionalParams): ProfissionalOutputDto {
    return {
      id: profissional.id.toString(),
      redeId: profissional.redeId,
      nome: profissional.nome,
      cpf: profissional.cpf,
      email: profissional.email,
      telefone: profissional.telefone,
      conselho: profissional.registro.conselho,
      numeroConselho: profissional.registro.numero,
      ufConselho: profissional.registro.uf,
      registroFormatado: profissional.registro.formatado,
      especialidade: profissional.especialidade.value,
      corAgenda: profissional.corAgenda,
      unidades: profissional.unidades,
      ativo: profissional.ativo,
    };
  }
}
