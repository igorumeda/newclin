import { Mapper } from '@core/application/mapper.base';
import type { Atendimento } from '../../domain/entities/atendimento.entity';
import type { AtendimentoOutputDto } from './atendimento.output.dto';

export type AtendimentoMapperParams = { atendimento: Atendimento };

export class AtendimentoMapper extends Mapper<AtendimentoMapperParams, AtendimentoOutputDto> {
  public map({ atendimento }: AtendimentoMapperParams): AtendimentoOutputDto {
    return {
      id: atendimento.id.toString(),
      redeId: atendimento.redeId,
      unidadeId: atendimento.unidadeId,
      agendamentoId: atendimento.agendamentoId,
      pacienteId: atendimento.pacienteId,
      profissionalId: atendimento.profissionalId,
      templateId: atendimento.templateId,
      templateVersao: atendimento.templateVersao,
      dadosPreenchidos: atendimento.dadosPreenchidos,
      camposFixos: atendimento.camposFixos,
      fontePagadora: atendimento.fontePagadora,
      status: atendimento.status,
      iniciadoEm: atendimento.iniciadoEm.toISOString(),
      finalizadoEm: atendimento.finalizadoEm?.toISOString() ?? null,
      criadoEm: atendimento.createdAt.toISOString(),
      atualizadoEm: atendimento.updatedAt.toISOString(),
    };
  }
}
