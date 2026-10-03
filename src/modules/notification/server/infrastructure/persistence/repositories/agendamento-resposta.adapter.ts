import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AplicarRespostaAgendamentoParams,
  AplicarRespostaAgendamentoResultado,
  IAgendamentoRespostaPort,
} from '../../../../domain/services/agendamento-resposta.interface';

export type AgendamentoRespostaAdapterDependencies = {
  supabase: SupabaseClient;
};

type AgendamentoRow = { id: string; status: string; paciente_id: string };

/**
 * Aplica a resposta do paciente (webhook WhatsApp) ao agendamento.
 * A transição de status é validada pelo trigger `transicao_status_valida` do
 * banco; respostas inválidas (ex.: agendamento já finalizado) não geram erro —
 * o motivo é devolvido para o log de notificações.
 */
export class AgendamentoRespostaAdapter implements IAgendamentoRespostaPort {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: AgendamentoRespostaAdapterDependencies) {
    this.supabase = dependencies.supabase;
  }

  async aplicarRespostaPaciente(
    params: AplicarRespostaAgendamentoParams,
  ): Promise<AplicarRespostaAgendamentoResultado> {
    const { data: agendamento } = await this.supabase
      .from('agendamentos')
      .select('id, status, paciente_id')
      .eq('id', params.agendamentoId)
      .is('deleted_at', null)
      .maybeSingle<AgendamentoRow>();

    if (!agendamento) {
      return {
        aplicado: false,
        statusAnterior: null,
        statusNovo: null,
        motivo: 'Agendamento não encontrado',
      };
    }

    const statusNovo = params.acao === 'confirmar' ? 'confirmado' : 'cancelado';

    if (agendamento.status === statusNovo) {
      return {
        aplicado: true,
        statusAnterior: agendamento.status,
        statusNovo,
        motivo: 'Agendamento já estava neste status',
      };
    }

    if (['finalizado', 'cancelado', 'faltou'].includes(agendamento.status)) {
      return {
        aplicado: false,
        statusAnterior: agendamento.status,
        statusNovo: null,
        motivo: `Agendamento ${agendamento.status} não aceita mais resposta do paciente`,
      };
    }

    const patch: Record<string, unknown> = { status: statusNovo, updated_at: new Date().toISOString() };
    if (statusNovo === 'confirmado') {
      patch.confirmado_por = 'paciente';
      patch.confirmado_em = new Date().toISOString();
    } else {
      patch.motivo_cancelamento = params.observacao ?? 'Cancelado pelo paciente via WhatsApp';
      patch.cancelado_em = new Date().toISOString();
    }

    const { error } = await this.supabase.from('agendamentos').update(patch).eq('id', params.agendamentoId);
    if (error) {
      return {
        aplicado: false,
        statusAnterior: agendamento.status,
        statusNovo: null,
        motivo: error.message,
      };
    }

    return { aplicado: true, statusAnterior: agendamento.status, statusNovo, motivo: null };
  }
}
