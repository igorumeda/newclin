import { AnexoRepository } from '../../../../domain/repositories/anexo-repository.base';
import type {
  BuscarAnexoParams,
  ListarAnexosParams,
  RemoverAnexoParams,
} from '../../../../domain/repositories/anexo-repository.interface';
import type { Anexo } from '../../../../domain/entities/anexo.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { AnexoPersistenceMapper } from '../mappers/anexo-persistence.mapper';
import type { AnexoModel } from '../models/anexo.model';

export type AnexoRepositoryDependencies = { db: DatabaseClient; mapper: AnexoPersistenceMapper };

export class AnexoRepositoryImpl extends AnexoRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: AnexoPersistenceMapper;

  constructor(dependencies: AnexoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarAnexoParams): Promise<Anexo | null> {
    const record = await this.db.queryOne<AnexoModel>({
      sql: 'SELECT * FROM anexos WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar({ redeId, pacienteId, atendimentoId }: ListarAnexosParams): Promise<Anexo[]> {
    const records = await this.db.query<AnexoModel>({
      sql: `SELECT * FROM anexos
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::uuid IS NULL OR paciente_id = $2::uuid)
               AND ($3::uuid IS NULL OR atendimento_id = $3::uuid)
             ORDER BY created_at DESC`,
      params: [redeId, pacienteId ?? null, atendimentoId ?? null],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(anexo: Anexo): Promise<void> {
    const data = this.mapper.toPersistence({ entity: anexo });
    await this.db.query({
      sql: `INSERT INTO anexos
              (id, rede_id, paciente_id, atendimento_id, nome_arquivo, mime_type,
               tamanho_bytes, storage_key, descricao, enviado_por)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      params: [
        data.id,
        data.rede_id,
        data.paciente_id,
        data.atendimento_id,
        data.nome_arquivo,
        data.mime_type,
        data.tamanho_bytes,
        data.storage_key,
        data.descricao,
        data.enviado_por,
      ],
    });
  }

  async remover({ redeId, id }: RemoverAnexoParams): Promise<void> {
    await this.db.query({
      sql: 'UPDATE anexos SET deleted_at = now() WHERE id = $1 AND rede_id = $2',
      params: [id, redeId],
    });
  }
}
