import type { SupabaseClient } from '@supabase/supabase-js';
import { TemplateProntuarioRepository } from '../../../../domain/repositories/prontuario-repositories.base';
import type {
  ListarTemplatesFiltro,
  TemplateId,
} from '../../../../domain/repositories/prontuario-repositories.interface';
import type { TemplateProntuario } from '../../../../domain/entities/template-prontuario.entity';
import { TemplateProntuarioPersistenceMapper } from '../mappers/prontuario-persistence.mapper';
import { TEMPLATE_PRONTUARIO_COLUMNS } from '../models/prontuario.model';
import type { TemplateProntuarioModel } from '../models/prontuario.model';

export type TemplateProntuarioRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: TemplateProntuarioPersistenceMapper;
};

export class TemplateProntuarioRepositoryImpl extends TemplateProntuarioRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: TemplateProntuarioPersistenceMapper;

  constructor(dependencies: TemplateProntuarioRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: TemplateId): Promise<TemplateProntuario | null> {
    const { data } = await this.supabase
      .from('templates_prontuario')
      .select(TEMPLATE_PRONTUARIO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<TemplateProntuarioModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarTemplatesFiltro): Promise<TemplateProntuario[]> {
    let query = this.supabase
      .from('templates_prontuario')
      .select(TEMPLATE_PRONTUARIO_COLUMNS)
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('especialidade', { ascending: true })
      .order('nome', { ascending: true });

    if (filtro.somenteAtivos !== false) query = query.eq('ativo', true);
    if (filtro.especialidade) query = query.eq('especialidade', filtro.especialidade);
    if (filtro.busca) query = query.ilike('nome', `%${filtro.busca}%`);

    const { data } = await query.returns<TemplateProntuarioModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async listarEspecialidades(redeId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('templates_prontuario')
      .select('especialidade')
      .eq('rede_id', redeId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .returns<{ especialidade: string }[]>();

    return [...new Set((data ?? []).map((linha) => linha.especialidade))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
  }

  async save(template: TemplateProntuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: template });
    const { error } = await this.supabase.from('templates_prontuario').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(template: TemplateProntuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: template });
    const { error } = await this.supabase.from('templates_prontuario').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async existsByNome(params: {
    redeId: string;
    nome: string;
    ignorarId?: string | null;
  }): Promise<boolean> {
    let query = this.supabase
      .from('templates_prontuario')
      .select('id', { count: 'exact', head: true })
      .eq('rede_id', params.redeId)
      .ilike('nome', params.nome)
      .is('deleted_at', null);

    if (params.ignorarId) query = query.neq('id', params.ignorarId);

    const { count } = await query;
    return (count ?? 0) > 0;
  }
}
