import { DestinatarioRepository } from '../../../../domain/repositories/destinatario-repository.base';
import type {
  BuscarDestinatarioParams,
  DestinatarioAgendamento,
  ListarParaLembreteParams,
} from '../../../../domain/repositories/destinatario-repository.interface';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';

export type DestinatarioRepositoryDependencies = { db: DatabaseClient };

type FormatarDataHoraParams = { inicio: Date; fusoHorario: string };
type DataHoraLocal = { dataLocal: string; horaLocal: string };

const FUSO_PADRAO = 'America/Sao_Paulo';

/** Conversão UTC → fuso da unidade: acontece na borda, nunca no domínio. */
function formatarDataHora({ inicio, fusoHorario }: FormatarDataHoraParams): DataHoraLocal {
  const fuso = fusoHorario || FUSO_PADRAO;
  return {
    dataLocal: new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(inicio),
    horaLocal: new Intl.DateTimeFormat('pt-BR', {
      timeZone: fuso,
      hour: '2-digit',
      minute: '2-digit',
    }).format(inicio),
  };
}

type DestinatarioRow = {
  rede_id: string;
  agendamento_id: string;
  paciente_id: string;
  paciente_nome: string;
  paciente_email: string | null;
  paciente_telefone: string | null;
  profissional_nome: string;
  unidade_nome: string;
  unidade_endereco: string;
  unidade_telefone: string | null;
  unidade_fuso: string;
  rede_nome: string;
  inicio: Date;
  status: string;
  configuracoes: Record<string, unknown> | null;
};

const SELECT_BASE = `
  SELECT a.rede_id,
         a.id                 AS agendamento_id,
         p.id                 AS paciente_id,
         p.nome               AS paciente_nome,
         p.email              AS paciente_email,
         p.telefone           AS paciente_telefone,
         pr.nome              AS profissional_nome,
         u.nome               AS unidade_nome,
         concat_ws(', ',
           NULLIF(u.endereco->>'logradouro', ''),
           NULLIF(u.endereco->>'numero', ''),
           NULLIF(u.endereco->>'bairro', ''),
           NULLIF(u.endereco->>'cidade', ''),
           NULLIF(u.endereco->>'uf', '')
         )                    AS unidade_endereco,
         u.telefone           AS unidade_telefone,
         u.fuso_horario       AS unidade_fuso,
         r.nome               AS rede_nome,
         a.data_hora_inicio   AS inicio,
         a.status::text       AS status,
         r.config             AS configuracoes
    FROM agendamentos a
    JOIN pacientes p      ON p.id = a.paciente_id
    JOIN profissionais pr ON pr.id = a.profissional_id
    JOIN unidades u       ON u.id = a.unidade_id
    JOIN redes r          ON r.id = a.rede_id
`;

export class DestinatarioRepositoryImpl extends DestinatarioRepository {
  private readonly db: DatabaseClient;

  constructor(dependencies: DestinatarioRepositoryDependencies) {
    super();
    this.db = dependencies.db;
  }

  async buscarPorAgendamento({
    redeId,
    agendamentoId,
  }: BuscarDestinatarioParams): Promise<DestinatarioAgendamento | null> {
    const record = await this.db.queryOne<DestinatarioRow>({
      sql: `${SELECT_BASE} WHERE a.rede_id = $1 AND a.id = $2 AND a.deleted_at IS NULL`,
      params: [redeId, agendamentoId],
    });
    return record ? this.toDestinatario(record) : null;
  }

  async listarParaLembrete({
    de,
    ate,
    limite,
  }: ListarParaLembreteParams): Promise<DestinatarioAgendamento[]> {
    const records = await this.db.query<DestinatarioRow>({
      sql: `${SELECT_BASE}
             WHERE a.deleted_at IS NULL
               AND a.status IN ('agendado', 'confirmado')
               AND a.data_hora_inicio >= $1::timestamptz
               AND a.data_hora_inicio < $2::timestamptz
             ORDER BY a.data_hora_inicio ASC
             LIMIT $3`,
      params: [de, ate, limite],
    });
    return records.map((record) => this.toDestinatario(record));
  }

  private toDestinatario(record: DestinatarioRow): DestinatarioAgendamento {
    const config = record.configuracoes ?? {};
    const inicio = new Date(record.inicio);
    const { dataLocal, horaLocal } = formatarDataHora({
      inicio,
      fusoHorario: record.unidade_fuso,
    });

    return {
      redeId: record.rede_id,
      agendamentoId: record.agendamento_id,
      pacienteId: record.paciente_id,
      pacienteNome: record.paciente_nome,
      pacienteEmail: record.paciente_email,
      pacienteTelefone: record.paciente_telefone,
      profissionalNome: record.profissional_nome,
      unidadeNome: record.unidade_nome,
      unidadeEndereco: record.unidade_endereco,
      unidadeTelefone: record.unidade_telefone,
      unidadeFusoHorario: record.unidade_fuso,
      redeNome: record.rede_nome,
      inicio: inicio.toISOString(),
      dataLocal,
      horaLocal,
      status: record.status,
      lembreteWhatsapp: config.lembreteWhatsapp !== false,
      lembreteEmail: config.lembreteEmail !== false,
      antecedenciaLembreteHoras: Number(config.antecedenciaLembreteHoras ?? 24),
    };
  }
}
