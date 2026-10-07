import { RelatorioRepository } from '../../../../domain/repositories/relatorio-repository.base';
import type {
  DistribuicaoItem,
  IndicadoresDashboard,
  IndicadoresParams,
  PeriodoRelatorioParams,
  ProdutividadeItem,
  ResumoFaltas,
  SerieTemporalPonto,
} from '../../../../domain/repositories/relatorio-repository.interface';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';

export type RelatorioRepositoryDependencies = { db: DatabaseClient };

type SerieRow = { chave: string; total: number };
type DistribuicaoRow = { rotulo: string; total: number };
type ProdutividadeRow = {
  profissional_id: string;
  profissional_nome: string;
  especialidade: string;
  agendados: number;
  finalizados: number;
  faltas: number;
  cancelados: number;
};
type ResumoFaltasRow = { total: number; faltas: number; cancelados: number };
type IndicadoresRow = {
  atendimentos_hoje: number;
  aguardando: number;
  em_atendimento: number;
  finalizados_hoje: number;
  pacientes_ativos: number;
  proximos_sete: number;
};

const FILTRO_AGENDA = `
  AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
  AND ($3::uuid IS NULL OR a.profissional_id = $3::uuid)
  AND a.data_hora_inicio >= $4::timestamptz
  AND a.data_hora_inicio < $5::timestamptz
`;

function percentual(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 1000) / 10;
}

function comPercentual(linhas: DistribuicaoRow[]): DistribuicaoItem[] {
  const total = linhas.reduce((soma, linha) => soma + Number(linha.total), 0);
  return linhas.map((linha) => ({
    rotulo: linha.rotulo,
    total: Number(linha.total),
    percentual: percentual(Number(linha.total), total),
  }));
}

export class RelatorioRepositoryImpl extends RelatorioRepository {
  private readonly db: DatabaseClient;

  constructor(dependencies: RelatorioRepositoryDependencies) {
    super();
    this.db = dependencies.db;
  }

  private parametros(params: PeriodoRelatorioParams): unknown[] {
    return [
      params.redeId,
      params.unidadeId ?? null,
      params.profissionalId ?? null,
      params.inicio,
      params.fim,
    ];
  }

  async atendimentosPorPeriodo(params: PeriodoRelatorioParams): Promise<SerieTemporalPonto[]> {
    const records = await this.db.query<SerieRow>({
      sql: `SELECT to_char(date_trunc('day', a.data_hora_inicio), 'YYYY-MM-DD') AS chave,
                   count(*)::int AS total
              FROM agendamentos a
             WHERE a.rede_id = $1 AND a.deleted_at IS NULL ${FILTRO_AGENDA}
             GROUP BY 1
             ORDER BY 1`,
      params: this.parametros(params),
    });
    return records.map((record) => ({
      chave: record.chave,
      rotulo: record.chave.split('-').reverse().join('/'),
      total: Number(record.total),
    }));
  }

  async resumoFaltas(params: PeriodoRelatorioParams): Promise<ResumoFaltas> {
    const [resumo, motivos] = await Promise.all([
      this.db.queryOne<ResumoFaltasRow>({
        sql: `SELECT count(*)::int AS total,
                     count(*) FILTER (WHERE a.status = 'faltou')::int AS faltas,
                     count(*) FILTER (WHERE a.status = 'cancelado')::int AS cancelados
                FROM agendamentos a
               WHERE a.rede_id = $1 AND a.deleted_at IS NULL ${FILTRO_AGENDA}`,
        params: this.parametros(params),
      }),
      this.db.query<DistribuicaoRow>({
        sql: `SELECT COALESCE(NULLIF(trim(a.motivo_cancelamento), ''), 'Não informado') AS rotulo,
                     count(*)::int AS total
                FROM agendamentos a
               WHERE a.rede_id = $1
                 AND a.deleted_at IS NULL
                 AND a.status = 'cancelado' ${FILTRO_AGENDA}
               GROUP BY 1
               ORDER BY total DESC
               LIMIT 10`,
        params: this.parametros(params),
      }),
    ]);

    const total = Number(resumo?.total ?? 0);
    const faltas = Number(resumo?.faltas ?? 0);
    const cancelados = Number(resumo?.cancelados ?? 0);

    return {
      total,
      faltas,
      cancelados,
      taxaFaltas: percentual(faltas, total),
      taxaCancelamentos: percentual(cancelados, total),
      porMotivo: comPercentual(motivos),
    };
  }

  async novosPacientesPorMes(params: PeriodoRelatorioParams): Promise<SerieTemporalPonto[]> {
    const records = await this.db.query<SerieRow>({
      sql: `SELECT to_char(date_trunc('month', p.created_at), 'YYYY-MM') AS chave,
                   count(*)::int AS total
              FROM pacientes p
             WHERE p.rede_id = $1
               AND p.deleted_at IS NULL
               AND p.created_at >= $2::timestamptz
               AND p.created_at < $3::timestamptz
             GROUP BY 1
             ORDER BY 1`,
      params: [params.redeId, params.inicio, params.fim],
    });
    return records.map((record) => {
      const [ano, mes] = record.chave.split('-');
      return { chave: record.chave, rotulo: `${mes}/${ano}`, total: Number(record.total) };
    });
  }

  async distribuicaoPorTipo(params: PeriodoRelatorioParams): Promise<DistribuicaoItem[]> {
    const records = await this.db.query<DistribuicaoRow>({
      sql: `SELECT t.nome AS rotulo, count(*)::int AS total
              FROM agendamentos a
              JOIN tipos_atendimento t ON t.id = a.tipo_atendimento_id
             WHERE a.rede_id = $1 AND a.deleted_at IS NULL ${FILTRO_AGENDA}
             GROUP BY 1
             ORDER BY total DESC`,
      params: this.parametros(params),
    });
    return comPercentual(records);
  }

  async distribuicaoPorEspecialidade(
    params: PeriodoRelatorioParams,
  ): Promise<DistribuicaoItem[]> {
    const records = await this.db.query<DistribuicaoRow>({
      sql: `SELECT pr.especialidade AS rotulo, count(*)::int AS total
              FROM agendamentos a
              JOIN profissionais pr ON pr.id = a.profissional_id
             WHERE a.rede_id = $1 AND a.deleted_at IS NULL ${FILTRO_AGENDA}
             GROUP BY 1
             ORDER BY total DESC`,
      params: this.parametros(params),
    });
    return comPercentual(records);
  }

  async produtividade(params: PeriodoRelatorioParams): Promise<ProdutividadeItem[]> {
    const records = await this.db.query<ProdutividadeRow>({
      sql: `SELECT pr.id          AS profissional_id,
                   pr.nome        AS profissional_nome,
                   pr.especialidade,
                   count(*)::int  AS agendados,
                   count(*) FILTER (WHERE a.status = 'finalizado')::int AS finalizados,
                   count(*) FILTER (WHERE a.status = 'faltou')::int     AS faltas,
                   count(*) FILTER (WHERE a.status = 'cancelado')::int  AS cancelados
              FROM agendamentos a
              JOIN profissionais pr ON pr.id = a.profissional_id
             WHERE a.rede_id = $1 AND a.deleted_at IS NULL ${FILTRO_AGENDA}
             GROUP BY pr.id, pr.nome, pr.especialidade
             ORDER BY finalizados DESC, pr.nome ASC`,
      params: this.parametros(params),
    });

    return records.map((record) => {
      const agendados = Number(record.agendados);
      return {
        profissionalId: record.profissional_id,
        profissionalNome: record.profissional_nome,
        especialidade: record.especialidade,
        agendados,
        finalizados: Number(record.finalizados),
        faltas: Number(record.faltas),
        cancelados: Number(record.cancelados),
        taxaComparecimento: percentual(Number(record.finalizados), agendados),
      };
    });
  }

  async indicadores(params: IndicadoresParams): Promise<IndicadoresDashboard> {
    const record = await this.db.queryOne<IndicadoresRow>({
      sql: `WITH dia AS (
              SELECT date_trunc('day', $3::timestamptz) AS inicio,
                     date_trunc('day', $3::timestamptz) + INTERVAL '1 day' AS fim
            )
            SELECT
              (SELECT count(*)::int FROM agendamentos a, dia
                WHERE a.rede_id = $1 AND a.deleted_at IS NULL
                  AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
                  AND a.data_hora_inicio >= dia.inicio AND a.data_hora_inicio < dia.fim
              ) AS atendimentos_hoje,
              (SELECT count(*)::int FROM agendamentos a, dia
                WHERE a.rede_id = $1 AND a.deleted_at IS NULL
                  AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
                  AND a.status = 'aguardando'
                  AND a.data_hora_inicio >= dia.inicio AND a.data_hora_inicio < dia.fim
              ) AS aguardando,
              (SELECT count(*)::int FROM agendamentos a, dia
                WHERE a.rede_id = $1 AND a.deleted_at IS NULL
                  AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
                  AND a.status = 'em_atendimento'
                  AND a.data_hora_inicio >= dia.inicio AND a.data_hora_inicio < dia.fim
              ) AS em_atendimento,
              (SELECT count(*)::int FROM agendamentos a, dia
                WHERE a.rede_id = $1 AND a.deleted_at IS NULL
                  AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
                  AND a.status = 'finalizado'
                  AND a.data_hora_inicio >= dia.inicio AND a.data_hora_inicio < dia.fim
              ) AS finalizados_hoje,
              (SELECT count(*)::int FROM pacientes p
                WHERE p.rede_id = $1 AND p.deleted_at IS NULL AND p.ativo IS TRUE
              ) AS pacientes_ativos,
              (SELECT count(*)::int FROM agendamentos a, dia
                WHERE a.rede_id = $1 AND a.deleted_at IS NULL
                  AND ($2::uuid IS NULL OR a.unidade_id = $2::uuid)
                  AND a.status IN ('agendado', 'confirmado')
                  AND a.data_hora_inicio >= dia.inicio
                  AND a.data_hora_inicio < dia.inicio + INTERVAL '7 days'
              ) AS proximos_sete`,
      params: [params.redeId, params.unidadeId ?? null, params.referencia],
    });

    const atendimentosHoje = Number(record?.atendimentos_hoje ?? 0);
    const finalizadosHoje = Number(record?.finalizados_hoje ?? 0);

    return {
      atendimentosHoje,
      aguardando: Number(record?.aguardando ?? 0),
      emAtendimento: Number(record?.em_atendimento ?? 0),
      finalizadosHoje,
      pacientesAtivos: Number(record?.pacientes_ativos ?? 0),
      proximosSete: Number(record?.proximos_sete ?? 0),
      taxaOcupacao: percentual(finalizadosHoje, atendimentosHoje),
    };
  }
}
