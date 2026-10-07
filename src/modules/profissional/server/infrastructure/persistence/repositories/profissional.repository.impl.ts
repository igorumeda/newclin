import { ProfissionalRepository } from '../../../../domain/repositories/profissional-repository.base';
import type {
  BuscarProfissionalParams,
  DefinirHorariosParams,
  ListarHorariosParams,
  ListarProfissionaisParams,
} from '../../../../domain/repositories/profissional-repository.interface';
import type { Profissional } from '../../../../domain/entities/profissional.entity';
import type { HorarioAtendimento } from '../../../../domain/entities/horario-atendimento.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { ProfissionalPersistenceMapper } from '../mappers/profissional-persistence.mapper';
import { HorarioPersistenceMapper } from '../mappers/horario-persistence.mapper';
import type { HorarioAtendimentoModel, ProfissionalModel } from '../models/profissional.model';

export type ProfissionalRepositoryDependencies = {
  db: DatabaseClient;
  mapper: ProfissionalPersistenceMapper;
  horarioMapper: HorarioPersistenceMapper;
};

const SELECT_BASE = `
  SELECT p.*, COALESCE(
           (SELECT array_agg(pu.unidade_id::text)
              FROM profissional_unidades pu
             WHERE pu.profissional_id = p.id AND pu.ativo IS TRUE),
           ARRAY[]::text[]
         ) AS unidades
    FROM profissionais p
`;

export class ProfissionalRepositoryImpl extends ProfissionalRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: ProfissionalPersistenceMapper;
  private readonly horarioMapper: HorarioPersistenceMapper;

  constructor(dependencies: ProfissionalRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
    this.horarioMapper = dependencies.horarioMapper;
  }

  async buscarPorId({ redeId, id }: BuscarProfissionalParams): Promise<Profissional | null> {
    const record = await this.db.queryOne<ProfissionalModel>({
      sql: `${SELECT_BASE} WHERE p.id = $1 AND p.rede_id = $2 AND p.deleted_at IS NULL`,
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar(params: ListarProfissionaisParams): Promise<Profissional[]> {
    const records = await this.db.query<ProfissionalModel>({
      sql: `${SELECT_BASE}
             WHERE p.rede_id = $1
               AND p.deleted_at IS NULL
               AND ($2::boolean IS NOT TRUE OR p.ativo IS TRUE)
               AND ($3::text IS NULL
                    OR app_sem_acento(p.nome) LIKE '%' || app_sem_acento($3) || '%'
                    OR app_sem_acento(p.especialidade) LIKE '%' || app_sem_acento($3) || '%')
               AND ($4::uuid IS NULL OR EXISTS (
                     SELECT 1 FROM profissional_unidades pu
                      WHERE pu.profissional_id = p.id AND pu.unidade_id = $4::uuid))
             ORDER BY p.nome ASC`,
      params: [
        params.redeId,
        params.apenasAtivos ?? false,
        params.busca ?? null,
        params.unidadeId ?? null,
      ],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(profissional: Profissional): Promise<void> {
    const data = this.mapper.toPersistence({ entity: profissional });
    await this.db.query({
      sql: `INSERT INTO profissionais
              (id, rede_id, nome, cpf, email, telefone, conselho_classe, numero_conselho,
               uf_conselho, especialidade, cor_agenda, ativo)
            VALUES ($1,$2,$3,$4,$5,$6,$7::conselho_classe,$8,$9,$10,$11,$12)`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.cpf,
        data.email,
        data.telefone,
        data.conselho_classe,
        data.numero_conselho,
        data.uf_conselho,
        data.especialidade,
        data.cor_agenda,
        data.ativo,
      ],
    });
    await this.sincronizarUnidades(profissional);
  }

  async atualizar(profissional: Profissional): Promise<void> {
    const data = this.mapper.toPersistence({ entity: profissional });
    await this.db.query({
      sql: `UPDATE profissionais
               SET nome = $3, cpf = $4, email = $5, telefone = $6,
                   conselho_classe = $7::conselho_classe, numero_conselho = $8, uf_conselho = $9,
                   especialidade = $10, cor_agenda = $11, ativo = $12, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.cpf,
        data.email,
        data.telefone,
        data.conselho_classe,
        data.numero_conselho,
        data.uf_conselho,
        data.especialidade,
        data.cor_agenda,
        data.ativo,
      ],
    });
    await this.sincronizarUnidades(profissional);
  }

  async listarHorarios({
    redeId,
    profissionalId,
  }: ListarHorariosParams): Promise<HorarioAtendimento[]> {
    const records = await this.db.query<HorarioAtendimentoModel>({
      sql: `SELECT * FROM horarios_atendimento
             WHERE rede_id = $1 AND profissional_id = $2
             ORDER BY dia_semana ASC, hora_inicio ASC`,
      params: [redeId, profissionalId],
    });
    return records.map((record) => this.horarioMapper.map({ record }));
  }

  async definirHorarios({
    redeId,
    profissionalId,
    horarios,
  }: DefinirHorariosParams): Promise<void> {
    await this.db.query({
      sql: 'DELETE FROM horarios_atendimento WHERE rede_id = $1 AND profissional_id = $2',
      params: [redeId, profissionalId],
    });
    for (const horario of horarios) {
      await this.db.query({
        sql: `INSERT INTO horarios_atendimento
                (id, rede_id, profissional_id, unidade_id, dia_semana, hora_inicio, hora_fim, ativo)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        params: [
          horario.id.toString(),
          horario.redeId,
          horario.profissionalId,
          horario.unidadeId,
          horario.diaSemana,
          horario.horaInicio,
          horario.horaFim,
          horario.ativo,
        ],
      });
    }
  }

  private async sincronizarUnidades(profissional: Profissional): Promise<void> {
    await this.db.query({
      sql: 'DELETE FROM profissional_unidades WHERE profissional_id = $1',
      params: [profissional.id.toString()],
    });
    for (const unidadeId of profissional.unidades) {
      await this.db.query({
        sql: `INSERT INTO profissional_unidades (profissional_id, unidade_id, rede_id, ativo)
              VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,
        params: [profissional.id.toString(), unidadeId, profissional.redeId],
      });
    }
  }
}
