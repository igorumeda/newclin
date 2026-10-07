import { TipoAtendimentoRepository } from '../../../../domain/repositories/tipo-atendimento-repository.base';
import type {
  BuscarTipoAtendimentoParams,
  BuscarTipoPorNomeParams,
  ListarTiposAtendimentoParams,
} from '../../../../domain/repositories/tipo-atendimento-repository.interface';
import type { TipoAtendimento } from '../../../../domain/entities/tipo-atendimento.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { TipoAtendimentoPersistenceMapper } from '../mappers/tipo-atendimento-persistence.mapper';
import type { TipoAtendimentoModel } from '../models/tipo-atendimento.model';

export type TipoAtendimentoRepositoryDependencies = {
  db: DatabaseClient;
  mapper: TipoAtendimentoPersistenceMapper;
};

export class TipoAtendimentoRepositoryImpl extends TipoAtendimentoRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: TipoAtendimentoPersistenceMapper;

  constructor(dependencies: TipoAtendimentoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarTipoAtendimentoParams): Promise<TipoAtendimento | null> {
    const record = await this.db.queryOne<TipoAtendimentoModel>({
      sql: 'SELECT * FROM tipos_atendimento WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPorNome({
    redeId,
    nome,
    ignorarId,
  }: BuscarTipoPorNomeParams): Promise<TipoAtendimento | null> {
    const record = await this.db.queryOne<TipoAtendimentoModel>({
      sql: `SELECT * FROM tipos_atendimento
             WHERE rede_id = $1
               AND app_sem_acento(nome) = app_sem_acento($2)
               AND deleted_at IS NULL
               AND ($3::uuid IS NULL OR id <> $3::uuid)
             LIMIT 1`,
      params: [redeId, nome, ignorarId ?? null],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar({
    redeId,
    apenasAtivos,
  }: ListarTiposAtendimentoParams): Promise<TipoAtendimento[]> {
    const records = await this.db.query<TipoAtendimentoModel>({
      sql: `SELECT * FROM tipos_atendimento
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::boolean IS NOT TRUE OR ativo IS TRUE)
             ORDER BY nome ASC`,
      params: [redeId, apenasAtivos ?? false],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(tipo: TipoAtendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: tipo });
    await this.db.query({
      sql: `INSERT INTO tipos_atendimento (id, rede_id, nome, duracao_minutos, cor, ativo)
            VALUES ($1,$2,$3,$4,$5,$6)`,
      params: [data.id, data.rede_id, data.nome, data.duracao_minutos, data.cor, data.ativo],
    });
  }

  async atualizar(tipo: TipoAtendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: tipo });
    await this.db.query({
      sql: `UPDATE tipos_atendimento
               SET nome = $3, duracao_minutos = $4, cor = $5, ativo = $6, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [data.id, data.rede_id, data.nome, data.duracao_minutos, data.cor, data.ativo],
    });
  }
}
