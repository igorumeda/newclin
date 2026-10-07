import { BloqueioAgendaRepository } from '../../../../domain/repositories/bloqueio-repository.base';
import type {
  BuscarBloqueioParams,
  ListarBloqueiosParams,
  RemoverBloqueioParams,
} from '../../../../domain/repositories/bloqueio-repository.interface';
import type { BloqueioAgenda } from '../../../../domain/entities/bloqueio-agenda.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { BloqueioPersistenceMapper } from '../mappers/bloqueio-persistence.mapper';
import type { BloqueioModel } from '../models/bloqueio.model';

export type BloqueioRepositoryDependencies = {
  db: DatabaseClient;
  mapper: BloqueioPersistenceMapper;
};

export class BloqueioAgendaRepositoryImpl extends BloqueioAgendaRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: BloqueioPersistenceMapper;

  constructor(dependencies: BloqueioRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarBloqueioParams): Promise<BloqueioAgenda | null> {
    const record = await this.db.queryOne<BloqueioModel>({
      sql: 'SELECT * FROM bloqueios_agenda WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar(params: ListarBloqueiosParams): Promise<BloqueioAgenda[]> {
    const records = await this.db.query<BloqueioModel>({
      sql: `SELECT * FROM bloqueios_agenda
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::uuid IS NULL OR unidade_id = $2::uuid)
               AND ($3::uuid IS NULL OR profissional_id IS NULL OR profissional_id = $3::uuid)
               AND data_hora_inicio < $5::timestamptz
               AND data_hora_fim > $4::timestamptz
             ORDER BY data_hora_inicio ASC`,
      params: [
        params.redeId,
        params.unidadeId ?? null,
        params.profissionalId ?? null,
        params.inicio,
        params.fim,
      ],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(bloqueio: BloqueioAgenda): Promise<void> {
    const data = this.mapper.toPersistence({ entity: bloqueio });
    await this.db.query({
      sql: `INSERT INTO bloqueios_agenda
              (id, rede_id, unidade_id, profissional_id, motivo, data_hora_inicio,
               data_hora_fim, criado_por)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      params: [
        data.id,
        data.rede_id,
        data.unidade_id,
        data.profissional_id,
        data.motivo,
        data.data_hora_inicio,
        data.data_hora_fim,
        data.criado_por,
      ],
    });
  }

  async remover({ redeId, id }: RemoverBloqueioParams): Promise<void> {
    await this.db.query({
      sql: `UPDATE bloqueios_agenda SET deleted_at = now()
             WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL`,
      params: [id, redeId],
    });
  }
}
