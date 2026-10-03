import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AgendamentoLembreteResumo,
  IAgendamentoLembreteReader,
  ListarParaLembreteParams,
} from '../../../../domain/services/agendamento-lembrete-reader.interface';
import {
  AGENDAMENTO_LEMBRETE_SELECT,
} from '../models/notificacao.model';
import type { AgendamentoLembreteModel } from '../models/notificacao.model';

export type AgendamentoLembreteReaderDependencies = {
  supabase: SupabaseClient;
};

/** Status que ainda fazem sentido receber lembrete. */
const STATUS_ELEGIVEIS = ['agendado', 'confirmado'];

/**
 * ACL de leitura da agenda para o worker de lembretes (§4.2).
 * Usa `service_role` porque roda fora de uma requisição autenticada.
 */
export class AgendamentoLembreteReader implements IAgendamentoLembreteReader {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: AgendamentoLembreteReaderDependencies) {
    this.supabase = dependencies.supabase;
  }

  async listarParaLembrete(params: ListarParaLembreteParams): Promise<AgendamentoLembreteResumo[]> {
    let query = this.supabase
      .from('agendamentos')
      .select(AGENDAMENTO_LEMBRETE_SELECT)
      .is('deleted_at', null)
      .in('status', STATUS_ELEGIVEIS)
      .gte('data_hora_inicio', params.janelaInicio.toISOString())
      .lte('data_hora_inicio', params.janelaFim.toISOString())
      .order('data_hora_inicio')
      .limit(params.limite);

    if (params.redeId) query = query.eq('rede_id', params.redeId);

    const { data, error } = await query.returns<AgendamentoLembreteModel[]>();
    if (error) throw new Error(error.message);

    return (data ?? [])
      .filter((row) => row.pacientes && row.unidades)
      .map((row) => ({
        agendamentoId: row.id,
        redeId: row.rede_id,
        redeNome: row.redes?.nome ?? 'Clínica',
        unidadeId: row.unidade_id,
        unidadeNome: row.unidades?.nome ?? '',
        unidadeEndereco: this.formatarEndereco(row),
        unidadeTelefone: row.unidades?.telefone ?? null,
        timezone: row.unidades?.timezone ?? 'America/Sao_Paulo',
        pacienteId: row.paciente_id,
        pacienteNome: row.pacientes?.nome ?? '',
        telefone: row.pacientes?.telefone ?? null,
        email: row.pacientes?.email ?? null,
        profissionalNome: row.profissionais?.nome ?? '',
        profissionalEspecialidade: row.profissionais?.especialidade ?? null,
        dataHora: new Date(row.data_hora_inicio),
        status: row.status,
      }));
  }

  private formatarEndereco(row: AgendamentoLembreteModel): string {
    const unidade = row.unidades;
    if (!unidade) return '';

    return [
      [unidade.logradouro, unidade.numero].filter(Boolean).join(', '),
      unidade.complemento,
      unidade.bairro,
      [unidade.cidade, unidade.uf].filter(Boolean).join('/'),
    ]
      .filter((parte) => Boolean(parte))
      .join(' — ');
  }
}
