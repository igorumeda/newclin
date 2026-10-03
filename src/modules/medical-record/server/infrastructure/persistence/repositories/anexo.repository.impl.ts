import type { SupabaseClient } from '@supabase/supabase-js';
import { AnexoRepository } from '../../../../domain/repositories/prontuario-repositories.base';
import type {
  AnexoId,
  ListarAnexosFiltro,
} from '../../../../domain/repositories/prontuario-repositories.interface';
import type { Anexo } from '../../../../domain/entities/anexo.entity';
import { AnexoPersistenceMapper } from '../mappers/prontuario-persistence.mapper';
import { ANEXO_COLUMNS } from '../models/prontuario.model';
import type { AnexoModel } from '../models/prontuario.model';

export type AnexoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: AnexoPersistenceMapper;
};

export class AnexoRepositoryImpl extends AnexoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: AnexoPersistenceMapper;

  constructor(dependencies: AnexoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: AnexoId): Promise<Anexo | null> {
    const { data } = await this.supabase
      .from('anexos')
      .select(ANEXO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<AnexoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarAnexosFiltro): Promise<Anexo[]> {
    let query = this.supabase
      .from('anexos')
      .select(ANEXO_COLUMNS)
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filtro.pacienteId) query = query.eq('paciente_id', filtro.pacienteId);
    if (filtro.atendimentoId) query = query.eq('atendimento_id', filtro.atendimentoId);

    const { data } = await query.returns<AnexoModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(anexo: Anexo): Promise<void> {
    const data = this.mapper.toPersistence({ entity: anexo });
    const { error } = await this.supabase.from('anexos').insert(data);
    if (error) throw new Error(error.message);
  }

  async softDelete(id: AnexoId): Promise<void> {
    const { error } = await this.supabase
      .from('anexos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
