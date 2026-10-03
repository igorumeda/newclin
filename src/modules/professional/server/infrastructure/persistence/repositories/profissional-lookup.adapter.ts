import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  HorarioResumo,
  IProfissionalLookup,
  ProfissionalResumo,
} from '../../../../domain/services/profissional-lookup.interface';
import { ProfissionalPersistenceMapper } from '../mappers/profissional-persistence.mapper';
import { HORARIO_COLUMNS, PROFISSIONAL_COLUMNS } from '../models/profissional.models';
import type { HorarioAtendimentoModel, ProfissionalModel } from '../models/profissional.models';

export type ProfissionalLookupAdapterDependencies = {
  supabase: SupabaseClient;
  mapper: ProfissionalPersistenceMapper;
};

/** Anti-Corruption Layer de leitura para agenda, prontuário e relatórios. */
export class ProfissionalLookupAdapter implements IProfissionalLookup {
  private readonly supabase: SupabaseClient;
  private readonly mapper: ProfissionalPersistenceMapper;

  constructor(dependencies: ProfissionalLookupAdapterDependencies) {
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(profissionalId: string): Promise<ProfissionalResumo | null> {
    const { data } = await this.supabase
      .from('profissionais')
      .select(PROFISSIONAL_COLUMNS)
      .eq('id', profissionalId)
      .is('deleted_at', null)
      .maybeSingle<ProfissionalModel>();

    return data ? this.toResumo(this.mapper.toDomain({ record: data })) : null;
  }

  async listarAtivos(redeId: string, unidadeId?: string | null): Promise<ProfissionalResumo[]> {
    let ids: string[] | null = null;

    if (unidadeId) {
      const { data: vinculos } = await this.supabase
        .from('profissional_unidades')
        .select('profissional_id')
        .eq('unidade_id', unidadeId)
        .is('deleted_at', null);

      ids = (vinculos ?? []).map((vinculo) => vinculo.profissional_id as string);
      if (ids.length === 0) return [];
    }

    let query = this.supabase
      .from('profissionais')
      .select(PROFISSIONAL_COLUMNS)
      .eq('rede_id', redeId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('nome');

    if (ids) query = query.in('id', ids);

    const { data } = await query.returns<ProfissionalModel[]>();
    return (data ?? []).map((record) => this.toResumo(this.mapper.toDomain({ record })));
  }

  async listarHorarios(params: {
    profissionalId: string;
    unidadeId?: string | null;
  }): Promise<HorarioResumo[]> {
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

    return (data ?? []).map((record) => ({
      id: record.id,
      profissionalId: record.profissional_id,
      unidadeId: record.unidade_id,
      diaSemana: record.dia_semana,
      horaInicio: record.hora_inicio.slice(0, 5),
      horaFim: record.hora_fim.slice(0, 5),
      duracaoSlotMinutos: record.duracao_slot_minutos,
      intervaloMinutos: record.intervalo_minutos,
    }));
  }

  private toResumo(profissional: ReturnType<ProfissionalPersistenceMapper['toDomain']>): ProfissionalResumo {
    return {
      id: profissional.id.toString(),
      nome: profissional.nome,
      especialidade: profissional.especialidade,
      registroFormatado: profissional.registro.formatado(),
      corAgenda: profissional.corAgenda,
      email: profissional.email,
      telefone: profissional.telefone,
      ativo: profissional.ativo,
    };
  }
}
