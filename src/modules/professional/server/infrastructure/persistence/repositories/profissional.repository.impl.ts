import type { SupabaseClient } from '@supabase/supabase-js';
import { ProfissionalRepository } from '../../../../domain/repositories/profissional-repository.base';
import type {
  ListarProfissionaisFiltro,
  ProfissionalId,
  SalvarHorariosParams,
} from '../../../../domain/repositories/profissional-repository.interface';
import type { Profissional } from '../../../../domain/entities/profissional.entity';
import type { HorarioAtendimento } from '../../../../domain/entities/horario-atendimento.entity';
import {
  HorarioAtendimentoPersistenceMapper,
  ProfissionalPersistenceMapper,
} from '../mappers/profissional-persistence.mapper';
import { HORARIO_COLUMNS, PROFISSIONAL_COLUMNS } from '../models/profissional.models';
import type { HorarioAtendimentoModel, ProfissionalModel } from '../models/profissional.models';

export type ProfissionalRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: ProfissionalPersistenceMapper;
  horarioMapper: HorarioAtendimentoPersistenceMapper;
};

export class ProfissionalRepositoryImpl extends ProfissionalRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: ProfissionalPersistenceMapper;
  private readonly horarioMapper: HorarioAtendimentoPersistenceMapper;

  constructor(dependencies: ProfissionalRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
    this.horarioMapper = dependencies.horarioMapper;
  }

  async findById(id: ProfissionalId): Promise<Profissional | null> {
    const { data } = await this.supabase
      .from('profissionais')
      .select(PROFISSIONAL_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<ProfissionalModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarProfissionaisFiltro): Promise<Profissional[]> {
    let query = this.supabase
      .from('profissionais')
      .select(PROFISSIONAL_COLUMNS)
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('nome');

    if (filtro.busca) query = query.ilike('nome', `%${filtro.busca}%`);
    if (filtro.especialidade) query = query.ilike('especialidade', `%${filtro.especialidade}%`);
    if (filtro.ativo !== null && filtro.ativo !== undefined) query = query.eq('ativo', filtro.ativo);

    if (filtro.unidadeId) {
      const { data: vinculos } = await this.supabase
        .from('profissional_unidades')
        .select('profissional_id')
        .eq('unidade_id', filtro.unidadeId)
        .is('deleted_at', null);

      const ids = (vinculos ?? []).map((vinculo) => vinculo.profissional_id as string);
      if (ids.length === 0) return [];
      query = query.in('id', ids);
    }

    const { data } = await query.returns<ProfissionalModel[]>();
    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(profissional: Profissional): Promise<void> {
    const data = this.mapper.toPersistence({ entity: profissional });
    const { error } = await this.supabase.from('profissionais').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(profissional: Profissional): Promise<void> {
    const data = this.mapper.toPersistence({ entity: profissional });
    const { error } = await this.supabase.from('profissionais').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async existsByRegistro(params: {
    redeId: string;
    conselhoClasse: string;
    numeroConselho: string;
    ufConselho: string | null;
    ignorarId?: string;
  }): Promise<boolean> {
    let query = this.supabase
      .from('profissionais')
      .select('id', { count: 'exact', head: true })
      .eq('rede_id', params.redeId)
      .eq('conselho_classe', params.conselhoClasse)
      .eq('numero_conselho', params.numeroConselho)
      .is('deleted_at', null);

    query = params.ufConselho ? query.eq('uf_conselho', params.ufConselho) : query.is('uf_conselho', null);
    if (params.ignorarId) query = query.neq('id', params.ignorarId);

    const { count } = await query;
    return (count ?? 0) > 0;
  }

  async listarUnidades(params: { profissionalId: string }): Promise<string[]> {
    const { data } = await this.supabase
      .from('profissional_unidades')
      .select('unidade_id')
      .eq('profissional_id', params.profissionalId)
      .eq('ativo', true)
      .is('deleted_at', null);

    return (data ?? []).map((row) => row.unidade_id as string);
  }

  async definirUnidades(params: {
    redeId: string;
    profissionalId: string;
    unidadeIds: string[];
  }): Promise<void> {
    await this.supabase
      .from('profissional_unidades')
      .delete()
      .eq('profissional_id', params.profissionalId);

    if (params.unidadeIds.length === 0) return;

    const { error } = await this.supabase.from('profissional_unidades').insert(
      params.unidadeIds.map((unidadeId) => ({
        rede_id: params.redeId,
        profissional_id: params.profissionalId,
        unidade_id: unidadeId,
      })),
    );
    if (error) throw new Error(error.message);
  }

  async listarHorarios(params: {
    profissionalId: string;
    unidadeId?: string | null;
  }): Promise<HorarioAtendimento[]> {
    let query = this.supabase
      .from('horarios_atendimento')
      .select(HORARIO_COLUMNS)
      .eq('profissional_id', params.profissionalId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('dia_semana')
      .order('hora_inicio');

    if (params.unidadeId) query = query.eq('unidade_id', params.unidadeId);

    const { data } = await query.returns<HorarioAtendimentoModel[]>();
    return (data ?? []).map((record) => this.horarioMapper.toDomain({ record }));
  }

  async salvarHorarios(params: SalvarHorariosParams): Promise<void> {
    // Os horários chegam já validados pelo caso de uso (entidade de domínio).
    const rows = params.horarios.map((horario) => ({
      rede_id: horario.redeId,
      profissional_id: horario.profissionalId,
      unidade_id: horario.unidadeId,
      dia_semana: horario.diaSemana,
      hora_inicio: horario.horaInicio,
      hora_fim: horario.horaFim,
      duracao_slot_minutos: horario.duracaoSlotMinutos ?? 30,
      intervalo_minutos: horario.intervaloMinutos ?? 0,
      ativo: true,
    }));

    const { error } = await this.supabase.from('horarios_atendimento').insert(rows);
    if (error) throw new Error(error.message);
  }

  async removerHorarios(params: { profissionalId: string; unidadeId: string }): Promise<void> {
    const { error } = await this.supabase
      .from('horarios_atendimento')
      .delete()
      .eq('profissional_id', params.profissionalId)
      .eq('unidade_id', params.unidadeId);

    if (error) throw new Error(error.message);
  }
}
