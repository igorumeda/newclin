import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUnidadeLookup, UnidadeResumo } from '../../../../domain/services/unidade-lookup.interface';
import { UNIDADE_COLUMNS } from '../models/organizacao.models';
import type { UnidadeModel } from '../models/organizacao.models';
import { UnidadePersistenceMapper } from '../mappers/organizacao-persistence.mapper';

export type UnidadeLookupAdapterDependencies = {
  supabase: SupabaseClient;
  mapper: UnidadePersistenceMapper;
};

/**
 * Anti-Corruption Layer: expõe um read model de unidade para outros contextos
 * (agenda, prontuário, documentos) sem vazar o domínio de organização.
 */
export class UnidadeLookupAdapter implements IUnidadeLookup {
  private readonly supabase: SupabaseClient;
  private readonly mapper: UnidadePersistenceMapper;

  constructor(dependencies: UnidadeLookupAdapterDependencies) {
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(unidadeId: string): Promise<UnidadeResumo | null> {
    const { data } = await this.supabase
      .from('unidades')
      .select(UNIDADE_COLUMNS)
      .eq('id', unidadeId)
      .is('deleted_at', null)
      .maybeSingle<UnidadeModel>();

    return data ? this.toResumo(this.mapper.toDomain({ record: data })) : null;
  }

  async listarAtivas(redeId: string, unidadeIds?: string[]): Promise<UnidadeResumo[]> {
    let query = this.supabase
      .from('unidades')
      .select(UNIDADE_COLUMNS)
      .eq('rede_id', redeId)
      .eq('ativo', true)
      .is('deleted_at', null)
      .order('nome');

    if (unidadeIds && unidadeIds.length > 0) query = query.in('id', unidadeIds);

    const { data } = await query.returns<UnidadeModel[]>();
    return (data ?? []).map((record) => this.toResumo(this.mapper.toDomain({ record })));
  }

  private toResumo(unidade: ReturnType<UnidadePersistenceMapper['toDomain']>): UnidadeResumo {
    return {
      id: unidade.id.toString(),
      nome: unidade.nome,
      cnes: unidade.cnes,
      telefone: unidade.telefone,
      email: unidade.email,
      enderecoCompleto: unidade.endereco.formatado(),
      timezone: unidade.timezone,
      ativo: unidade.ativo,
    };
  }
}
