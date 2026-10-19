import type { SupabaseClient } from '@supabase/supabase-js';
import { ModeloMensagemRepository } from '../../../../domain/repositories/modelo-mensagem-repository.base';
import type { BuscarModeloParams } from '../../../../domain/repositories/modelo-mensagem-repository.interface';
import type { ModeloMensagem } from '../../../../domain/entities/modelo-mensagem.entity';
import { ModeloMensagemPersistenceMapper } from '../mappers/notificacao-persistence.mapper';
import { MODELO_MENSAGEM_COLUMNS } from '../models/notificacao.model';
import type { ModeloMensagemModel } from '../models/notificacao.model';

export type ModeloMensagemRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: ModeloMensagemPersistenceMapper;
};

export class ModeloMensagemRepositoryImpl extends ModeloMensagemRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: ModeloMensagemPersistenceMapper;

  constructor(dependencies: ModeloMensagemRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async listar(redeId: string): Promise<ModeloMensagem[]> {
    const { data } = await this.supabase
      .from('modelos_mensagem')
      .select(MODELO_MENSAGEM_COLUMNS)
      .eq('rede_id', redeId)
      .is('deleted_at', null)
      .order('canal')
      .order('tipo')
      .returns<ModeloMensagemModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  /** Retorna o modelo ativo da rede; cai para o modelo padrão quando editado/desativado. */
  async buscarAtivo(params: BuscarModeloParams): Promise<ModeloMensagem | null> {
    const { data } = await this.supabase
      .from('modelos_mensagem')
      .select(MODELO_MENSAGEM_COLUMNS)
      .eq('rede_id', params.redeId)
      .eq('canal', params.canal)
      .eq('tipo', params.tipo)
      .is('deleted_at', null)
      .order('ativo', { ascending: false })
      .limit(1)
      .maybeSingle<ModeloMensagemModel>();

    if (!data) return null;

    const modelo = this.mapper.toDomain({ record: data });
    if (!modelo.ativo) return null;

    return modelo;
  }

  async save(modelo: ModeloMensagem): Promise<void> {
    const data = this.mapper.toPersistence({ entity: modelo });
    const { error } = await this.supabase.from('modelos_mensagem').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(modelo: ModeloMensagem): Promise<void> {
    const data = this.mapper.toPersistence({ entity: modelo });
    const { error } = await this.supabase.from('modelos_mensagem').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }
}
