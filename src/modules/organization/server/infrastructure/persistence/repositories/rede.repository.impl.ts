import type { SupabaseClient } from '@supabase/supabase-js';
import { RedeRepository } from '../../../../domain/repositories/rede-repository.base';
import type { RedeId } from '../../../../domain/repositories/rede-repository.interface';
import type { Rede } from '../../../../domain/entities/rede.entity';
import { RedePersistenceMapper } from '../mappers/organizacao-persistence.mapper';
import { REDE_COLUMNS } from '../models/organizacao.models';
import type { RedeModel } from '../models/organizacao.models';

export type RedeRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: RedePersistenceMapper;
};

export class RedeRepositoryImpl extends RedeRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: RedePersistenceMapper;

  constructor(dependencies: RedeRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: RedeId): Promise<Rede | null> {
    const { data } = await this.supabase
      .from('redes')
      .select(REDE_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<RedeModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async update(rede: Rede): Promise<void> {
    const data = this.mapper.toPersistence({ entity: rede });
    const { error } = await this.supabase.from('redes').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }
}
