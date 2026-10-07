import { AuditoriaRepository } from '../../../../domain/repositories/auditoria-repository.base';
import type {
  AcessoProntuarioRegistro,
  ContarAuditoriaParams,
  ListarAcessosProntuarioParams,
  ListarAuditoriaParams,
  RegistrarAcessoProntuarioParams,
} from '../../../../domain/repositories/auditoria-repository.interface';
import type { RegistroAuditoria } from '../../../../domain/entities/registro-auditoria.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { AuditoriaPersistenceMapper } from '../mappers/auditoria-persistence.mapper';
import type { AuditoriaModel } from '../models/auditoria.model';

export type AuditoriaRepositoryDependencies = {
  db: DatabaseClient;
  mapper: AuditoriaPersistenceMapper;
};

type AcessoRow = {
  id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  paciente_id: string;
  paciente_nome: string;
  atendimento_id: string | null;
  ip: string | null;
  created_at: Date;
};

const FILTROS = `
  AND ($2::uuid IS NULL OR usuario_id = $2::uuid)
  AND ($3::text IS NULL OR entidade = $3)
  AND ($4::text IS NULL OR entidade_id = $4)
  AND ($5::auditoria_acao IS NULL OR acao = $5::auditoria_acao)
  AND ($6::timestamptz IS NULL OR created_at >= $6::timestamptz)
  AND ($7::timestamptz IS NULL OR created_at <= $7::timestamptz)
`;

export class AuditoriaRepositoryImpl extends AuditoriaRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: AuditoriaPersistenceMapper;

  constructor(dependencies: AuditoriaRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async registrar(registro: RegistroAuditoria): Promise<void> {
    const data = this.mapper.toPersistence({ entity: registro });
    await this.db.query({
      sql: `INSERT INTO auditoria
              (id, rede_id, usuario_id, usuario_nome, unidade_id, acao, entidade, entidade_id,
               descricao, dados_antes, dados_depois, ip, user_agent)
            VALUES ($1,$2,$3,$4,$5,$6::auditoria_acao,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13)`,
      params: [
        data.id,
        data.rede_id,
        data.usuario_id,
        data.usuario_nome,
        data.unidade_id,
        data.acao,
        data.entidade,
        data.entidade_id,
        data.descricao,
        data.dados_antes,
        data.dados_depois,
        data.ip,
        data.user_agent,
      ],
    });
  }

  async listar(params: ListarAuditoriaParams): Promise<RegistroAuditoria[]> {
    const records = await this.db.query<AuditoriaModel>({
      sql: `SELECT * FROM auditoria
             WHERE rede_id = $1 ${FILTROS}
             ORDER BY created_at DESC
             LIMIT $8 OFFSET $9`,
      params: [
        params.redeId,
        params.usuarioId ?? null,
        params.entidade ?? null,
        params.entidadeId ?? null,
        params.acao ?? null,
        params.de ?? null,
        params.ate ?? null,
        params.limite,
        params.offset,
      ],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async contar(params: ContarAuditoriaParams): Promise<number> {
    const record = await this.db.queryOne<{ total: number }>({
      sql: `SELECT count(*)::int AS total FROM auditoria WHERE rede_id = $1 ${FILTROS}`,
      params: [
        params.redeId,
        params.usuarioId ?? null,
        params.entidade ?? null,
        params.entidadeId ?? null,
        params.acao ?? null,
        params.de ?? null,
        params.ate ?? null,
      ],
    });
    return record?.total ?? 0;
  }

  async registrarAcessoProntuario(params: RegistrarAcessoProntuarioParams): Promise<void> {
    await this.db.query({
      sql: `INSERT INTO acessos_prontuario
              (rede_id, usuario_id, usuario_nome, paciente_id, atendimento_id, unidade_id,
               ip, user_agent)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      params: [
        params.redeId,
        params.usuarioId,
        params.usuarioNome,
        params.pacienteId,
        params.atendimentoId ?? null,
        params.unidadeId ?? null,
        params.ip ?? null,
        params.userAgent ?? null,
      ],
    });
  }

  async listarAcessosProntuario({
    redeId,
    pacienteId,
    limite,
  }: ListarAcessosProntuarioParams): Promise<AcessoProntuarioRegistro[]> {
    const records = await this.db.query<AcessoRow>({
      sql: `SELECT ap.id, ap.usuario_id, ap.usuario_nome, ap.paciente_id,
                   p.nome AS paciente_nome, ap.atendimento_id, ap.ip, ap.created_at
              FROM acessos_prontuario ap
              JOIN pacientes p ON p.id = ap.paciente_id
             WHERE ap.rede_id = $1
               AND ($2::uuid IS NULL OR ap.paciente_id = $2::uuid)
             ORDER BY ap.created_at DESC
             LIMIT $3`,
      params: [redeId, pacienteId ?? null, limite ?? 100],
    });
    return records.map((record) => ({
      id: record.id,
      usuarioId: record.usuario_id,
      usuarioNome: record.usuario_nome,
      pacienteId: record.paciente_id,
      pacienteNome: record.paciente_nome,
      atendimentoId: record.atendimento_id,
      ip: record.ip,
      criadoEm: new Date(record.created_at).toISOString(),
    }));
  }
}
