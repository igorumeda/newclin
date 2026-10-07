import { UnidadeRepository } from '../../../../domain/repositories/unidade-repository.base';
import type {
  BuscarUnidadeParams,
  ListarUnidadesParams,
} from '../../../../domain/repositories/unidade-repository.interface';
import type { Unidade } from '../../../../domain/entities/unidade.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { UnidadePersistenceMapper } from '../mappers/unidade-persistence.mapper';
import type { UnidadeModel } from '../models/unidade.model';

export type UnidadeRepositoryDependencies = {
  db: DatabaseClient;
  mapper: UnidadePersistenceMapper;
};

export class UnidadeRepositoryImpl extends UnidadeRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: UnidadePersistenceMapper;

  constructor(dependencies: UnidadeRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarUnidadeParams): Promise<Unidade | null> {
    const record = await this.db.queryOne<UnidadeModel>({
      sql: 'SELECT * FROM unidades WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar({ redeId, busca, apenasAtivas }: ListarUnidadesParams): Promise<Unidade[]> {
    const records = await this.db.query<UnidadeModel>({
      sql: `SELECT * FROM unidades
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::boolean IS NOT TRUE OR ativo IS TRUE)
               AND ($3::text IS NULL OR app_sem_acento(nome) LIKE '%' || app_sem_acento($3) || '%')
             ORDER BY nome ASC`,
      params: [redeId, apenasAtivas ?? false, busca ?? null],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(unidade: Unidade): Promise<void> {
    const data = this.mapper.toPersistence({ entity: unidade });
    await this.db.query({
      sql: `INSERT INTO unidades
              (id, rede_id, nome, codigo, telefone, email, endereco, fuso_horario, ativo)
            VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.codigo,
        data.telefone,
        data.email,
        data.endereco,
        data.fuso_horario,
        data.ativo,
      ],
    });
  }

  async atualizar(unidade: Unidade): Promise<void> {
    const data = this.mapper.toPersistence({ entity: unidade });
    await this.db.query({
      sql: `UPDATE unidades
               SET nome = $3, codigo = $4, telefone = $5, email = $6, endereco = $7::jsonb,
                   fuso_horario = $8, ativo = $9, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.codigo,
        data.telefone,
        data.email,
        data.endereco,
        data.fuso_horario,
        data.ativo,
      ],
    });
  }
}
