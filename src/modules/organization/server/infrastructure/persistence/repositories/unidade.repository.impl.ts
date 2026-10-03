import type { SupabaseClient } from '@supabase/supabase-js';
import { UnidadeRepository } from '../../../../domain/repositories/unidade-repository.base';
import type {
  ListarUnidadesFiltro,
  UnidadeId,
} from '../../../../domain/repositories/unidade-repository.interface';
import type { Unidade } from '../../../../domain/entities/unidade.entity';
import { UnidadePersistenceMapper } from '../mappers/organizacao-persistence.mapper';
import { UNIDADE_COLUMNS } from '../models/organizacao.models';
import type { UnidadeModel } from '../models/organizacao.models';

export type UnidadeRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: UnidadePersistenceMapper;
};

export class UnidadeRepositoryImpl extends UnidadeRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: UnidadePersistenceMapper;

  constructor(dependencies: UnidadeRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: UnidadeId): Promise<Unidade | null> {
    const { data } = await this.supabase
      .from('unidades')
      .select(UNIDADE_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<UnidadeModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarUnidadesFiltro): Promise<Unidade[]> {
    let query = this.supabase
      .from('unidades')
      .select(UNIDADE_COLUMNS)
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('nome', { ascending: true });

    if (filtro.unidadeIdsRestritas && filtro.unidadeIdsRestritas.length > 0) {
      query = query.in('id', filtro.unidadeIdsRestritas);
    }
    if (filtro.busca) {
      query = query.ilike('nome', `%${filtro.busca}%`);
    }
    if (filtro.ativo !== null && filtro.ativo !== undefined) {
      query = query.eq('ativo', filtro.ativo);
    }

    const { data } = await query.returns<UnidadeModel[]>();
    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(unidade: Unidade): Promise<void> {
    const data = this.mapper.toPersistence({ entity: unidade });
    const { error } = await this.supabase.from('unidades').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(unidade: Unidade): Promise<void> {
    const data = this.mapper.toPersistence({ entity: unidade });
    const { error } = await this.supabase.from('unidades').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async existsByNome(params: { redeId: string; nome: string; ignorarId?: string }): Promise<boolean> {
    let query = this.supabase
      .from('unidades')
      .select('id', { count: 'exact', head: true })
      .eq('rede_id', params.redeId)
      .ilike('nome', params.nome)
      .is('deleted_at', null);

    if (params.ignorarId) query = query.neq('id', params.ignorarId);

    const { count } = await query;
    return (count ?? 0) > 0;
  }

  async existsByCnes(params: { redeId: string; cnes: string; ignorarId?: string }): Promise<boolean> {
    let query = this.supabase
      .from('unidades')
      .select('id', { count: 'exact', head: true })
      .eq('rede_id', params.redeId)
      .eq('cnes', params.cnes)
      .is('deleted_at', null);

    if (params.ignorarId) query = query.neq('id', params.ignorarId);

    const { count } = await query;
    return (count ?? 0) > 0;
  }
}
