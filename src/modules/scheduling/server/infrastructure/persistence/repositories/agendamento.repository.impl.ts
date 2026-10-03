import type { SupabaseClient } from '@supabase/supabase-js';
import { AgendamentoRepository } from '../../../../domain/repositories/agendamento-repository.base';
import type {
  AgendamentoId,
  HistoricoStatusItem,
  ListarAgendamentosFiltro,
  ListarAgendamentosResultado,
  VerificarConflitoParams,
} from '../../../../domain/repositories/agendamento-repository.interface';
import type { Agendamento } from '../../../../domain/entities/agendamento.entity';
import type {
  BloqueioAgendaDetalhe,
  ConflitoAgendaDetalhe,
} from '../../../../domain/errors/agendamento.errors';
import { AgendamentoPersistenceMapper } from '../mappers/agenda-persistence.mapper';
import { AGENDAMENTO_COLUMNS } from '../models/agenda.models';
import type {
  AgendamentoModel,
  BloqueioHorarioModel,
  ConflitoAgendaModel,
  HistoricoStatusModel,
} from '../models/agenda.models';

export type AgendamentoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: AgendamentoPersistenceMapper;
};

export class AgendamentoRepositoryImpl extends AgendamentoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: AgendamentoPersistenceMapper;

  constructor(dependencies: AgendamentoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: AgendamentoId): Promise<Agendamento | null> {
    const { data } = await this.supabase
      .from('agendamentos')
      .select(AGENDAMENTO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<AgendamentoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarAgendamentosFiltro): Promise<ListarAgendamentosResultado> {
    const page = filtro.page ?? 1;
    const perPage = filtro.perPage ?? 200;
    const from = (page - 1) * perPage;

    let query = this.supabase
      .from('agendamentos')
      .select(AGENDAMENTO_COLUMNS, { count: 'exact' })
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .gte('data_hora_inicio', filtro.de)
      .lte('data_hora_inicio', filtro.ate)
      .order('data_hora_inicio')
      .range(from, from + perPage - 1);

    if (filtro.unidadeId) query = query.eq('unidade_id', filtro.unidadeId);
    if (filtro.profissionalId) query = query.eq('profissional_id', filtro.profissionalId);
    if (filtro.pacienteId) query = query.eq('paciente_id', filtro.pacienteId);
    if (filtro.status && filtro.status.length > 0) query = query.in('status', filtro.status);
    if (!filtro.incluirCancelados && (!filtro.status || filtro.status.length === 0)) {
      query = query.not('status', 'in', '(cancelado,faltou)');
    }

    const { data, count } = await query.returns<AgendamentoModel[]>();

    return {
      items: (data ?? []).map((record) => this.mapper.toDomain({ record })),
      total: count ?? 0,
    };
  }

  async save(agendamento: Agendamento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: agendamento });
    const { error } = await this.supabase.from('agendamentos').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(agendamento: Agendamento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: agendamento });
    const { error } = await this.supabase.from('agendamentos').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async verificarConflito(params: VerificarConflitoParams): Promise<ConflitoAgendaDetalhe[]> {
    const { data, error } = await this.supabase.rpc('verificar_conflito_agenda', {
      p_profissional_id: params.profissionalId,
      p_unidade_id: params.unidadeId,
      p_inicio: params.inicio,
      p_fim: params.fim,
      p_ignorar_agendamento_id: params.ignorarAgendamentoId ?? null,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as ConflitoAgendaModel[]).map((row) => ({
      agendamentoId: row.agendamento_id,
      pacienteId: row.paciente_id,
      pacienteNome: row.paciente_nome,
      inicio: row.data_hora_inicio,
      fim: row.data_hora_fim,
      status: row.status,
      encaixe: row.encaixe,
    }));
  }

  async verificarBloqueio(params: {
    profissionalId: string;
    unidadeId: string;
    inicio: string;
    fim: string;
  }): Promise<BloqueioAgendaDetalhe[]> {
    const { data, error } = await this.supabase.rpc('verificar_bloqueio_agenda', {
      p_profissional_id: params.profissionalId,
      p_unidade_id: params.unidadeId,
      p_inicio: params.inicio,
      p_fim: params.fim,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as BloqueioHorarioModel[]).map((row) => ({
      bloqueioId: row.bloqueio_id,
      tipo: row.tipo,
      motivo: row.motivo,
      inicio: row.inicio,
      fim: row.fim,
    }));
  }

  async listarHistorico(agendamentoId: string): Promise<HistoricoStatusItem[]> {
    const { data } = await this.supabase
      .from('agendamento_status_historico')
      .select('id, status_anterior, status_novo, observacao, alterado_por, created_at')
      .eq('agendamento_id', agendamentoId)
      .order('created_at', { ascending: false })
      .returns<HistoricoStatusModel[]>();

    return (data ?? []).map((row) => ({
      id: row.id,
      statusAnterior: row.status_anterior,
      statusNovo: row.status_novo,
      observacao: row.observacao,
      alteradoPor: row.alterado_por,
      createdAt: row.created_at,
    }));
  }

  async contarFuturosPorProfissional(params: {
    profissionalId: string;
    aPartirDe: string;
  }): Promise<number> {
    const { count } = await this.supabase
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('profissional_id', params.profissionalId)
      .gte('data_hora_inicio', params.aPartirDe)
      .in('status', ['agendado', 'confirmado', 'aguardando', 'em_atendimento'])
      .is('deleted_at', null);

    return count ?? 0;
  }
}
