import type { SupabaseClient } from '@supabase/supabase-js';
import { EvolucaoRepository } from '../../../../domain/repositories/prontuario-repositories.base';
import type { Evolucao } from '../../../../domain/entities/evolucao.entity';
import { EvolucaoPersistenceMapper } from '../mappers/prontuario-persistence.mapper';
import { EVOLUCAO_COLUMNS } from '../models/prontuario.model';
import type { EvolucaoModel } from '../models/prontuario.model';

export type EvolucaoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: EvolucaoPersistenceMapper;
};

export class EvolucaoRepositoryImpl extends EvolucaoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: EvolucaoPersistenceMapper;

  constructor(dependencies: EvolucaoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async listarPorAtendimento(atendimentoId: string): Promise<Evolucao[]> {
    const { data } = await this.supabase
      .from('evolucoes')
      .select(EVOLUCAO_COLUMNS)
      .eq('atendimento_id', atendimentoId)
      .order('created_at', { ascending: true })
      .returns<EvolucaoModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(evolucao: Evolucao): Promise<void> {
    const data = this.mapper.toPersistence({ entity: evolucao });
    const { error } = await this.supabase.from('evolucoes').insert(data);
    if (error) throw new Error(error.message);
  }
}
