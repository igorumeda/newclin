import { AgendamentoRepository } from '../../../../domain/repositories/agendamento-repository.base';
import type {
  BuscarAgendamentoParams,
  ContagemPorStatus,
  ContarPorStatusParams,
  ListarAgendamentosParams,
  ListarParaLembreteParams,
  ListarPorPacienteParams,
  ProximaOrdemChegadaParams,
} from '../../../../domain/repositories/agendamento-repository.interface';
import type { Agendamento } from '../../../../domain/entities/agendamento.entity';
import type { StatusAgendamentoValue } from '../../../../domain/value-objects/status-agendamento.vo';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { AgendamentoPersistenceMapper } from '../mappers/agendamento-persistence.mapper';
import type { AgendamentoModel } from '../models/agendamento.model';

export type AgendamentoRepositoryDependencies = {
  db: DatabaseClient;
  mapper: AgendamentoPersistenceMapper;
};

export class AgendamentoRepositoryImpl extends AgendamentoRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: AgendamentoPersistenceMapper;

  constructor(dependencies: AgendamentoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarAgendamentoParams): Promise<Agendamento | null> {
    const record = await this.db.queryOne<AgendamentoModel>({
      sql: 'SELECT * FROM agendamentos WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar(params: ListarAgendamentosParams): Promise<Agendamento[]> {
    const records = await this.db.query<AgendamentoModel>({
      sql: `SELECT * FROM agendamentos
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::uuid IS NULL OR unidade_id = $2::uuid)
               AND ($3::uuid IS NULL OR profissional_id = $3::uuid)
               AND ($4::uuid IS NULL OR paciente_id = $4::uuid)
               AND data_hora_inicio < $6::timestamptz
               AND data_hora_fim > $5::timestamptz
               AND ($7::agendamento_status[] IS NULL OR status = ANY ($7::agendamento_status[]))
             ORDER BY data_hora_inicio ASC`,
      params: [
        params.redeId,
        params.unidadeId ?? null,
        params.profissionalId ?? null,
        params.pacienteId ?? null,
        params.inicio,
        params.fim,
        params.status ?? null,
      ],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async listarPorPaciente({
    redeId,
    pacienteId,
    limite,
  }: ListarPorPacienteParams): Promise<Agendamento[]> {
    const records = await this.db.query<AgendamentoModel>({
      sql: `SELECT * FROM agendamentos
             WHERE rede_id = $1 AND paciente_id = $2 AND deleted_at IS NULL
             ORDER BY data_hora_inicio DESC
             LIMIT $3`,
      params: [redeId, pacienteId, limite ?? 50],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async listarParaLembrete({ redeId, de, ate }: ListarParaLembreteParams): Promise<Agendamento[]> {
    const records = await this.db.query<AgendamentoModel>({
      sql: `SELECT * FROM agendamentos
             WHERE deleted_at IS NULL
               AND ($1::uuid IS NULL OR rede_id = $1::uuid)
               AND status IN ('agendado', 'confirmado')
               AND data_hora_inicio BETWEEN $2::timestamptz AND $3::timestamptz
             ORDER BY data_hora_inicio ASC`,
      params: [redeId ?? null, de, ate],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async proximaOrdemChegada({
    redeId,
    unidadeId,
    data,
  }: ProximaOrdemChegadaParams): Promise<number> {
    const record = await this.db.queryOne<{ proxima: number }>({
      sql: `SELECT COALESCE(MAX(ordem_chegada), 0)::int + 1 AS proxima
              FROM agendamentos
             WHERE rede_id = $1
               AND unidade_id = $2
               AND deleted_at IS NULL
               AND data_hora_inicio >= date_trunc('day', $3::timestamptz)
               AND data_hora_inicio < date_trunc('day', $3::timestamptz) + INTERVAL '1 day'`,
      params: [redeId, unidadeId, data],
    });
    return record?.proxima ?? 1;
  }

  async contarPorStatus(params: ContarPorStatusParams): Promise<ContagemPorStatus[]> {
    const records = await this.db.query<{ status: string; total: number }>({
      sql: `SELECT status::text AS status, count(*)::int AS total
              FROM agendamentos
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::uuid IS NULL OR unidade_id = $2::uuid)
               AND data_hora_inicio >= $3::timestamptz
               AND data_hora_inicio < $4::timestamptz
             GROUP BY status`,
      params: [params.redeId, params.unidadeId ?? null, params.inicio, params.fim],
    });
    return records.map((record) => ({
      status: record.status as StatusAgendamentoValue,
      total: record.total,
    }));
  }

  async salvar(agendamento: Agendamento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: agendamento });
    await this.db.query({
      sql: `INSERT INTO agendamentos
              (id, rede_id, unidade_id, profissional_id, paciente_id, tipo_atendimento_id,
               data_hora_inicio, data_hora_fim, status, encaixe, observacoes, motivo_cancelamento,
               checkin_em, ordem_chegada, origem, criado_por)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::agendamento_status,$10,$11,$12,$13,$14,
                    $15::agendamento_origem,$16)`,
      params: [
        data.id,
        data.rede_id,
        data.unidade_id,
        data.profissional_id,
        data.paciente_id,
        data.tipo_atendimento_id,
        data.data_hora_inicio,
        data.data_hora_fim,
        data.status,
        data.encaixe,
        data.observacoes,
        data.motivo_cancelamento,
        data.checkin_em,
        data.ordem_chegada,
        data.origem,
        data.criado_por,
      ],
    });
  }

  async atualizar(agendamento: Agendamento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: agendamento });
    await this.db.query({
      sql: `UPDATE agendamentos
               SET unidade_id = $3, profissional_id = $4, paciente_id = $5,
                   tipo_atendimento_id = $6, data_hora_inicio = $7, data_hora_fim = $8,
                   status = $9::agendamento_status, encaixe = $10, observacoes = $11,
                   motivo_cancelamento = $12, checkin_em = $13, ordem_chegada = $14,
                   updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.unidade_id,
        data.profissional_id,
        data.paciente_id,
        data.tipo_atendimento_id,
        data.data_hora_inicio,
        data.data_hora_fim,
        data.status,
        data.encaixe,
        data.observacoes,
        data.motivo_cancelamento,
        data.checkin_em,
        data.ordem_chegada,
      ],
    });
  }
}
