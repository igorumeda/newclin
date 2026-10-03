import type { SupabaseClient } from '@supabase/supabase-js';
import { DocumentoRepository } from '../../../../domain/repositories/documento-repository.base';
import type {
  DocumentoId,
  ListarDocumentosFiltro,
  ListarDocumentosResultado,
} from '../../../../domain/repositories/documento-repository.interface';
import type { Documento } from '../../../../domain/entities/documento.entity';
import type { TipoDocumento } from '../../../../domain/value-objects/tipo-documento.vo';
import { DocumentoPersistenceMapper } from '../mappers/documento-persistence.mapper';
import { DOCUMENTO_COLUMNS } from '../models/documento.model';
import type { DocumentoModel } from '../models/documento.model';

export type DocumentoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: DocumentoPersistenceMapper;
};

export class DocumentoRepositoryImpl extends DocumentoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: DocumentoPersistenceMapper;

  constructor(dependencies: DocumentoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: DocumentoId): Promise<Documento | null> {
    const { data } = await this.supabase
      .from('documentos')
      .select(DOCUMENTO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<DocumentoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarDocumentosFiltro): Promise<ListarDocumentosResultado> {
    const page = filtro.page && filtro.page > 0 ? filtro.page : 1;
    const perPage = filtro.perPage && filtro.perPage > 0 ? filtro.perPage : 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = this.supabase
      .from('documentos')
      .select(DOCUMENTO_COLUMNS, { count: 'exact' })
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filtro.pacienteId) query = query.eq('paciente_id', filtro.pacienteId);
    if (filtro.atendimentoId) query = query.eq('atendimento_id', filtro.atendimentoId);
    if (filtro.profissionalId) query = query.eq('profissional_id', filtro.profissionalId);
    if (filtro.unidadeId) query = query.eq('unidade_id', filtro.unidadeId);
    if (filtro.tipo) query = query.eq('tipo', filtro.tipo);
    if (filtro.status && filtro.status.length > 0) query = query.in('status', filtro.status);
    if (filtro.de) query = query.gte('created_at', `${filtro.de}T00:00:00.000Z`);
    if (filtro.ate) query = query.lte('created_at', `${filtro.ate}T23:59:59.999Z`);

    const { data, count } = await query.returns<DocumentoModel[]>();

    return {
      items: (data ?? []).map((record) => this.mapper.toDomain({ record })),
      total: count ?? 0,
    };
  }

  async save(documento: Documento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: documento });
    const { error } = await this.supabase.from('documentos').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(documento: Documento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: documento });
    const { error } = await this.supabase.from('documentos').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async proximoNumero(params: { redeId: string; tipo: TipoDocumento }): Promise<number> {
    const { data } = await this.supabase
      .from('documentos')
      .select('numero')
      .eq('rede_id', params.redeId)
      .eq('tipo', params.tipo)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle<{ numero: number }>();

    return Number(data?.numero ?? 0) + 1;
  }
}
