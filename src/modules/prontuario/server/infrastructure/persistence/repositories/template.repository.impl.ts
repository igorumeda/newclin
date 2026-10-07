import { TemplateProntuarioRepository } from '../../../../domain/repositories/template-repository.base';
import type {
  BuscarTemplateParams,
  BuscarTemplatePadraoParams,
  ListarTemplatesParams,
} from '../../../../domain/repositories/template-repository.interface';
import type { TemplateProntuario } from '../../../../domain/entities/template-prontuario.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { TemplatePersistenceMapper } from '../mappers/template-persistence.mapper';
import type { TemplateModel } from '../models/template.model';

export type TemplateRepositoryDependencies = {
  db: DatabaseClient;
  mapper: TemplatePersistenceMapper;
};

export class TemplateProntuarioRepositoryImpl extends TemplateProntuarioRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: TemplatePersistenceMapper;

  constructor(dependencies: TemplateRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarTemplateParams): Promise<TemplateProntuario | null> {
    const record = await this.db.queryOne<TemplateModel>({
      sql: `SELECT * FROM templates_prontuario
             WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL`,
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPadraoPorEspecialidade({
    redeId,
    especialidade,
  }: BuscarTemplatePadraoParams): Promise<TemplateProntuario | null> {
    const record = await this.db.queryOne<TemplateModel>({
      sql: `SELECT * FROM templates_prontuario
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ativo IS TRUE
               AND app_sem_acento(especialidade) = app_sem_acento($2)
             ORDER BY padrao DESC, versao DESC
             LIMIT 1`,
      params: [redeId, especialidade],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar({
    redeId,
    especialidade,
    apenasAtivos,
  }: ListarTemplatesParams): Promise<TemplateProntuario[]> {
    const records = await this.db.query<TemplateModel>({
      sql: `SELECT * FROM templates_prontuario
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::boolean IS NOT TRUE OR ativo IS TRUE)
               AND ($3::text IS NULL
                    OR app_sem_acento(especialidade) = app_sem_acento($3))
             ORDER BY especialidade ASC, nome ASC`,
      params: [redeId, apenasAtivos ?? false, especialidade ?? null],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(template: TemplateProntuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: template });
    await this.db.query({
      sql: `INSERT INTO templates_prontuario
              (id, rede_id, nome, especialidade, descricao, versao, estrutura, padrao, ativo)
            VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.especialidade,
        data.descricao,
        data.versao,
        data.estrutura,
        data.padrao,
        data.ativo,
      ],
    });
  }

  async atualizar(template: TemplateProntuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: template });
    await this.db.query({
      sql: `UPDATE templates_prontuario
               SET nome = $3, especialidade = $4, descricao = $5, versao = $6,
                   estrutura = $7::jsonb, padrao = $8, ativo = $9, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.especialidade,
        data.descricao,
        data.versao,
        data.estrutura,
        data.padrao,
        data.ativo,
      ],
    });
  }
}
