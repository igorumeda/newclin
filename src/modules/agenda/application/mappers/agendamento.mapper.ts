import { Mapper } from '@core/application/mapper.base';
import type { Agendamento } from '../../domain/entities/agendamento.entity';
import type { AgendamentoOutputDto } from './agendamento.output.dto';

export type AgendamentoMapperParams = { agendamento: Agendamento };

export class AgendamentoMapper extends Mapper<AgendamentoMapperParams, AgendamentoOutputDto> {
  public map({ agendamento }: AgendamentoMapperParams): AgendamentoOutputDto {
    return {
      id: agendamento.id.toString(),
      redeId: agendamento.redeId,
      unidadeId: agendamento.unidadeId,
      profissionalId: agendamento.profissionalId,
      pacienteId: agendamento.pacienteId,
      tipoAtendimentoId: agendamento.tipoAtendimentoId,
      inicio: agendamento.periodo.inicio.toISOString(),
      fim: agendamento.periodo.fim.toISOString(),
      duracaoMinutos: agendamento.periodo.duracaoMinutos,
      status: agendamento.status.value,
      statusRotulo: agendamento.status.rotulo,
      encaixe: agendamento.encaixe,
      observacoes: agendamento.observacoes,
      motivoCancelamento: agendamento.motivoCancelamento,
      checkinEm: agendamento.checkinEm?.toISOString() ?? null,
      ordemChegada: agendamento.ordemChegada,
      origem: agendamento.origem,
      criadoEm: agendamento.createdAt.toISOString(),
      atualizadoEm: agendamento.updatedAt.toISOString(),
    };
  }
}
