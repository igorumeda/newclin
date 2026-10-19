import { formatInTimeZone } from 'date-fns-tz';
import type { UnidadeResumo } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { Agendamento } from '../../domain/entities/agendamento.entity';
import type { DadosNotificacaoAgendamento } from '../../domain/services/agenda-notificacao.interface';
import type { AgendaEnriquecimento } from '../mappers/agenda.mapper';

export type MontarDadosNotificacaoParams = {
  agendamento: Agendamento;
  enriquecimento: AgendaEnriquecimento;
  unidade: UnidadeResumo | null;
  redeNome: string;
  createdBy?: string | null;
};

/**
 * Monta as variáveis da mensagem a partir do agendamento (§4.1/§4.2).
 * Data e hora são formatadas no fuso da unidade; o banco permanece em UTC.
 */
export function montarDadosNotificacao(
  params: MontarDadosNotificacaoParams,
): DadosNotificacaoAgendamento {
  const { agendamento, enriquecimento, unidade, redeNome, createdBy } = params;
  const timezone = unidade?.timezone ?? 'America/Sao_Paulo';
  const inicio = agendamento.janela.inicio;

  return {
    redeId: agendamento.redeId,
    redeNome,
    agendamentoId: agendamento.id.toString(),
    data: formatInTimeZone(inicio, timezone, 'dd/MM/yyyy'),
    hora: formatInTimeZone(inicio, timezone, 'HH:mm'),
    profissionalNome: enriquecimento.profissionalNome ?? 'Profissional',
    profissionalEspecialidade: enriquecimento.profissionalEspecialidade,
    paciente: {
      pacienteId: agendamento.pacienteId,
      pacienteNome: enriquecimento.pacienteNome ?? 'Paciente',
      telefone: enriquecimento.pacienteTelefone,
      email: enriquecimento.pacienteEmail,
    },
    unidade: {
      nome: unidade?.nome ?? enriquecimento.unidadeNome ?? 'Unidade',
      enderecoCompleto: unidade?.enderecoCompleto ?? '',
      telefone: unidade?.telefone ?? null,
    },
    createdBy: createdBy ?? null,
  };
}
