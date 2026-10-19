import type { SupabaseClient } from '@supabase/supabase-js';
import { AtendimentoRepository } from '../../../../domain/repositories/prontuario-repositories.base';
import type {
  AtendimentoId,
  ListarAtendimentosFiltro,
  ListarAtendimentosResultado,
} from '../../../../domain/repositories/prontuario-repositories.interface';
import type { Atendimento } from '../../../../domain/entities/atendimento.entity';
import { AtendimentoPersistenceMapper } from '../mappers/prontuario-persistence.mapper';
import { ATENDIMENTO_COLUMNS } from '../models/prontuario.model';
import type { AtendimentoModel } from '../models/prontuario.model';

export type AtendimentoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: AtendimentoPersistenceMapper;
};

export class AtendimentoRepositoryImpl extends AtendimentoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: AtendimentoPersistenceMapper;

  constructor(dependencies: AtendimentoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: AtendimentoId): Promise<Atendimento | null> {
    const { data } = await this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<AtendimentoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async findByAgendamentoId(agendamentoId: string): Promise<Atendimento | null> {
    const { data } = await this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS)
      .eq('agendamento_id', agendamentoId)
      .is('deleted_at', null)
      .maybeSingle<AtendimentoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarAtendimentosFiltro): Promise<ListarAtendimentosResultado> {
    const page = filtro.page && filtro.page > 0 ? filtro.page : 1;
    const perPage = filtro.perPage && filtro.perPage > 0 ? filtro.perPage : 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS, { count: 'exact' })
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('iniciado_em', { ascending: false })
      .range(from, to);

    if (filtro.unidadeId) query = query.eq('unidade_id', filtro.unidadeId);
    if (filtro.pacienteId) query = query.eq('paciente_id', filtro.pacienteId);
    if (filtro.profissionalId) query = query.eq('profissional_id', filtro.profissionalId);
    if (filtro.de) query = query.gte('iniciado_em', `${filtro.de}T00:00:00.000Z`);
    if (filtro.ate) query = query.lte('iniciado_em', `${filtro.ate}T23:59:59.999Z`);
    if (filtro.status && filtro.status.length > 0) query = query.in('status', filtro.status);

    const { data, count } = await query.returns<AtendimentoModel[]>();

    return {
      items: (data ?? []).map((record) => this.mapper.toDomain({ record })),
      total: count ?? 0,
    };
  }

  async listarPorPaciente(params: {
    redeId: string;
    pacienteId: string;
    limite?: number;
  }): Promise<Atendimento[]> {
    const { data } = await this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS)
      .eq('rede_id', params.redeId)
      .eq('paciente_id', params.pacienteId)
      .is('deleted_at', null)
      .order('iniciado_em', { ascending: false })
      .limit(params.limite ?? 50)
      .returns<AtendimentoModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(atendimento: Atendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: atendimento });
    const { error } = await this.supabase.from('atendimentos').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(atendimento: Atendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: atendimento });
    const { error } = await this.supabase.from('atendimentos').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }
}
