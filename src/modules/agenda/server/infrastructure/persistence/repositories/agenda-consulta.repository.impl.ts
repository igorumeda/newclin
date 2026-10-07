import { AgendaConsultaRepository } from '../../../../domain/repositories/agenda-consulta-repository.base';
import type {
  AgendamentoDetalhado,
  ConsultarAgendaParams,
  ConsultarAgendamentoParams,
} from '../../../../domain/repositories/agenda-consulta-repository.interface';
import type { StatusAgendamentoValue } from '../../../../domain/value-objects/status-agendamento.vo';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';

export type AgendaConsultaRepositoryDependencies = { db: DatabaseClient };

type AgendaConsultaRow = {
  id: string;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  status: string;
  encaixe: boolean;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  checkin_em: Date | null;
  ordem_chegada: number | null;
  origem: string;
  atendimento_id: string | null;
  paciente_id: string;
  paciente_nome: string;
  paciente_telefone: string | null;
  paciente_nascimento: Date | string;
  profissional_id: string;
  profissional_nome: string;
  profissional_especialidade: string;
  profissional_cor: string;
  unidade_id: string;
  unidade_nome: string;
  unidade_fuso: string;
  tipo_id: string;
  tipo_nome: string;
  tipo_cor: string;
  tipo_duracao: number;
};

const SELECT_BASE = `
  SELECT a.id,
         a.data_hora_inicio,
         a.data_hora_fim,
         a.status::text                AS status,
         a.encaixe,
         a.observacoes,
         a.motivo_cancelamento,
         a.checkin_em,
         a.ordem_chegada,
         a.origem::text                AS origem,
         at.id                         AS atendimento_id,
         p.id                          AS paciente_id,
         p.nome                        AS paciente_nome,
         p.telefone                    AS paciente_telefone,
         p.data_nascimento             AS paciente_nascimento,
         pr.id                         AS profissional_id,
         pr.nome                       AS profissional_nome,
         pr.especialidade              AS profissional_especialidade,
         pr.cor_agenda                 AS profissional_cor,
         u.id                          AS unidade_id,
         u.nome                        AS unidade_nome,
         u.fuso_horario                AS unidade_fuso,
         t.id                          AS tipo_id,
         t.nome                        AS tipo_nome,
         t.cor                         AS tipo_cor,
         t.duracao_minutos             AS tipo_duracao
    FROM agendamentos a
    JOIN pacientes p          ON p.id = a.paciente_id
    JOIN profissionais pr     ON pr.id = a.profissional_id
    JOIN unidades u           ON u.id = a.unidade_id
    JOIN tipos_atendimento t  ON t.id = a.tipo_atendimento_id
    LEFT JOIN atendimentos at ON at.agendamento_id = a.id AND at.deleted_at IS NULL
`;

export class AgendaConsultaRepositoryImpl extends AgendaConsultaRepository {
  private readonly db: DatabaseClient;

  constructor(dependencies: AgendaConsultaRepositoryDependencies) {
    super();
    this.db = dependencies.db;
  }

  async consultar(params: ConsultarAgendaParams): Promise<AgendamentoDetalhado[]> {
    const records = await this.db.query<AgendaConsultaRow>({
      sql: `${SELECT_BASE}
             WHERE a.rede_id = $1
               AND a.deleted_at IS NULL
               AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
               AND ($3::uuid IS NULL OR a.profissional_id = $3::uuid)
               AND ($4::uuid IS NULL OR a.paciente_id = $4::uuid)
               AND a.data_hora_inicio < $6::timestamptz
               AND a.data_hora_fim > $5::timestamptz
               AND ($7::agendamento_status[] IS NULL OR a.status = ANY ($7::agendamento_status[]))
             ORDER BY a.data_hora_inicio ASC, pr.nome ASC`,
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
    return records.map((record) => this.toDetalhado(record));
  }

  async obter({ redeId, id }: ConsultarAgendamentoParams): Promise<AgendamentoDetalhado | null> {
    const record = await this.db.queryOne<AgendaConsultaRow>({
      sql: `${SELECT_BASE} WHERE a.rede_id = $1 AND a.id = $2 AND a.deleted_at IS NULL`,
      params: [redeId, id],
    });
    return record ? this.toDetalhado(record) : null;
  }

  private toDetalhado(record: AgendaConsultaRow): AgendamentoDetalhado {
    return {
      id: record.id,
      inicio: new Date(record.data_hora_inicio).toISOString(),
      fim: new Date(record.data_hora_fim).toISOString(),
      status: record.status as StatusAgendamentoValue,
      encaixe: record.encaixe,
      observacoes: record.observacoes,
      motivoCancelamento: record.motivo_cancelamento,
      checkinEm: record.checkin_em ? new Date(record.checkin_em).toISOString() : null,
      ordemChegada: record.ordem_chegada,
      origem: record.origem,
      atendimentoId: record.atendimento_id,
      paciente: {
        id: record.paciente_id,
        nome: record.paciente_nome,
        telefone: record.paciente_telefone,
        dataNascimento: String(
          record.paciente_nascimento instanceof Date
            ? record.paciente_nascimento.toISOString().slice(0, 10)
            : record.paciente_nascimento,
        ).slice(0, 10),
      },
      profissional: {
        id: record.profissional_id,
        nome: record.profissional_nome,
        especialidade: record.profissional_especialidade,
        corAgenda: record.profissional_cor,
      },
      unidade: { id: record.unidade_id, nome: record.unidade_nome, fusoHorario: record.unidade_fuso },
      tipoAtendimento: {
        id: record.tipo_id,
        nome: record.tipo_nome,
        cor: record.tipo_cor,
        duracaoMinutos: record.tipo_duracao,
      },
    };
  }
}
