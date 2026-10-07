import { RedeRepository } from '../../../../domain/repositories/rede-repository.base';
import type {
  BuscarRedeParams,
  BuscarRedePorSlugParams,
} from '../../../../domain/repositories/rede-repository.interface';
import type { Rede } from '../../../../domain/entities/rede.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { RedePersistenceMapper } from '../mappers/rede-persistence.mapper';
import type { RedeModel } from '../models/rede.model';

export type RedeRepositoryDependencies = { db: DatabaseClient; mapper: RedePersistenceMapper };

export class RedeRepositoryImpl extends RedeRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: RedePersistenceMapper;

  constructor(dependencies: RedeRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ id }: BuscarRedeParams): Promise<Rede | null> {
    const record = await this.db.queryOne<RedeModel>({
      sql: 'SELECT * FROM redes WHERE id = $1 AND deleted_at IS NULL',
      params: [id],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPorSlug({ slug }: BuscarRedePorSlugParams): Promise<Rede | null> {
    const record = await this.db.queryOne<RedeModel>({
      sql: 'SELECT * FROM redes WHERE slug = $1 AND deleted_at IS NULL',
      params: [slug],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async salvar(rede: Rede): Promise<void> {
    const data = this.mapper.toPersistence({ entity: rede });
    await this.db.query({
      sql: `INSERT INTO redes (id, nome, slug, cnpj, logotipo_url, tema, config, ativo)
            VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)`,
      params: [
        data.id,
        data.nome,
        data.slug,
        data.cnpj,
        data.logotipo_url,
        data.tema,
        data.config,
        data.ativo,
      ],
    });
  }

  async atualizar(rede: Rede): Promise<void> {
    const data = this.mapper.toPersistence({ entity: rede });
    await this.db.query({
      sql: `UPDATE redes
               SET nome = $2, cnpj = $3, logotipo_url = $4, tema = $5::jsonb,
                   config = $6::jsonb, ativo = $7, updated_at = now()
             WHERE id = $1`,
      params: [
        data.id,
        data.nome,
        data.cnpj,
        data.logotipo_url,
        data.tema,
        data.config,
        data.ativo,
      ],
    });
  }
}
