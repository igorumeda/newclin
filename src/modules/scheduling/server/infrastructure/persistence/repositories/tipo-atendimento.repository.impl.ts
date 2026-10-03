import type { SupabaseClient } from '@supabase/supabase-js';
import { TipoAtendimentoRepository } from '../../../../domain/repositories/tipo-atendimento-repository.base';
import type { ListarTiposAtendimentoFiltro } from '../../../../domain/repositories/tipo-atendimento-repository.interface';
import type { TipoAtendimento } from '../../../../domain/entities/tipo-atendimento.entity';
import { TipoAtendimentoPersistenceMapper } from '../mappers/agenda-persistence.mapper';
import { TIPO_ATENDIMENTO_COLUMNS } from '../models/agenda.models';
import type { TipoAtendimentoModel } from '../models/agenda.models';

export type TipoAtendimentoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: TipoAtendimentoPersistenceMapper;
};

export class TipoAtendimentoRepositoryImpl extends TipoAtendimentoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: TipoAtendimentoPersistenceMapper;

  constructor(dependencies: TipoAtendimentoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: string): Promise<TipoAtendimento | null> {
    const { data } = await this.supabase
      .from('tipos_atendimento')
      .select(TIPO_ATENDIMENTO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<TipoAtendimentoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarTiposAtendimentoFiltro): Promise<TipoAtendimento[]> {
    let query = this.supabase
      .from('tipos_atendimento')
      .select(TIPO_ATENDIMENTO_COLUMNS)
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('nome');

    if (filtro.somenteAtivos) query = query.eq('ativo', true);
    if (filtro.busca) query = query.ilike('nome', `%${filtro.busca}%`);

    const { data } = await query.returns<TipoAtendimentoModel[]>();
    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(tipo: TipoAtendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: tipo });
    const { error } = await this.supabase.from('tipos_atendimento').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(tipo: TipoAtendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: tipo });
    const { error } = await this.supabase.from('tipos_atendimento').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async existsByNome(params: {
    redeId: string;
    nome: string;
    ignorarId?: string | null;
  }): Promise<boolean> {
    let query = this.supabase
      .from('tipos_atendimento')
      .select('id', { count: 'exact', head: true })
      .eq('rede_id', params.redeId)
      .ilike('nome', params.nome)
      .is('deleted_at', null);

    if (params.ignorarId) query = query.neq('id', params.ignorarId);

    const { count } = await query;
    return (count ?? 0) > 0;
  }
}
