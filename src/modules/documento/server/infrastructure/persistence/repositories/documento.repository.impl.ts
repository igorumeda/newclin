import { DocumentoRepository } from '../../../../domain/repositories/documento-repository.base';
import type {
  BuscarDocumentoParams,
  ListarDocumentosParams,
} from '../../../../domain/repositories/documento-repository.interface';
import type { Documento } from '../../../../domain/entities/documento.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { DocumentoPersistenceMapper } from '../mappers/documento-persistence.mapper';
import type { DocumentoModel } from '../models/documento.model';

export type DocumentoRepositoryDependencies = {
  db: DatabaseClient;
  mapper: DocumentoPersistenceMapper;
};

export class DocumentoRepositoryImpl extends DocumentoRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: DocumentoPersistenceMapper;

  constructor(dependencies: DocumentoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarDocumentoParams): Promise<Documento | null> {
    const record = await this.db.queryOne<DocumentoModel>({
      sql: 'SELECT * FROM documentos WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar(params: ListarDocumentosParams): Promise<Documento[]> {
    const records = await this.db.query<DocumentoModel>({
      sql: `SELECT * FROM documentos
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::uuid IS NULL OR paciente_id = $2::uuid)
               AND ($3::uuid IS NULL OR atendimento_id = $3::uuid)
               AND ($4::documento_tipo IS NULL OR tipo = $4::documento_tipo)
             ORDER BY created_at DESC
             LIMIT $5`,
      params: [
        params.redeId,
        params.pacienteId ?? null,
        params.atendimentoId ?? null,
        params.tipo ?? null,
        params.limite ?? 100,
      ],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(documento: Documento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: documento });
    await this.db.query({
      sql: `INSERT INTO documentos
              (id, rede_id, unidade_id, paciente_id, atendimento_id, profissional_id, tipo,
               conteudo, status, storage_key, pdf_url, emitido_em, emitido_por)
            VALUES ($1,$2,$3,$4,$5,$6,$7::documento_tipo,$8::jsonb,$9::documento_status,
                    $10,$11,$12,$13)`,
      params: [
        data.id,
        data.rede_id,
        data.unidade_id,
        data.paciente_id,
        data.atendimento_id,
        data.profissional_id,
        data.tipo,
        data.conteudo,
        data.status,
        data.storage_key,
        data.pdf_url,
        data.emitido_em,
        data.emitido_por,
      ],
    });
  }

  async atualizar(documento: Documento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: documento });
    await this.db.query({
      sql: `UPDATE documentos
               SET conteudo = $3::jsonb, status = $4::documento_status, storage_key = $5,
                   pdf_url = $6, emitido_em = $7, emitido_por = $8, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.conteudo,
        data.status,
        data.storage_key,
        data.pdf_url,
        data.emitido_em,
        data.emitido_por,
      ],
    });
  }
}
