import { PacienteRepository } from '../../../../domain/repositories/paciente-repository.base';
import type {
  BuscarPacienteParams,
  BuscarPorCpfParams,
  BuscarPorNomeNascimentoParams,
  ContarPacientesParams,
  ListarPacientesParams,
} from '../../../../domain/repositories/paciente-repository.interface';
import type { Paciente } from '../../../../domain/entities/paciente.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { PacientePersistenceMapper } from '../mappers/paciente-persistence.mapper';
import type { PacienteModel } from '../models/paciente.model';

export type PacienteRepositoryDependencies = {
  db: DatabaseClient;
  mapper: PacientePersistenceMapper;
};

const FILTRO_BUSCA = `
  ($3::text IS NULL
   OR app_sem_acento(nome) LIKE '%' || app_sem_acento($3) || '%'
   OR cpf = regexp_replace(COALESCE($3, ''), '\\D', '', 'g'))
`;

export class PacienteRepositoryImpl extends PacienteRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: PacientePersistenceMapper;

  constructor(dependencies: PacienteRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarPacienteParams): Promise<Paciente | null> {
    const record = await this.db.queryOne<PacienteModel>({
      sql: 'SELECT * FROM pacientes WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPorCpf({ redeId, cpf, ignorarId }: BuscarPorCpfParams): Promise<Paciente | null> {
    const record = await this.db.queryOne<PacienteModel>({
      sql: `SELECT * FROM pacientes
             WHERE rede_id = $1 AND cpf = $2 AND deleted_at IS NULL
               AND ($3::uuid IS NULL OR id <> $3::uuid)
             LIMIT 1`,
      params: [redeId, cpf.value, ignorarId ?? null],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPorNomeENascimento({
    redeId,
    nome,
    dataNascimento,
    ignorarId,
  }: BuscarPorNomeNascimentoParams): Promise<Paciente | null> {
    const record = await this.db.queryOne<PacienteModel>({
      sql: `SELECT * FROM pacientes
             WHERE rede_id = $1
               AND app_sem_acento(nome) = app_sem_acento($2)
               AND data_nascimento = $3::date
               AND deleted_at IS NULL
               AND ($4::uuid IS NULL OR id <> $4::uuid)
             LIMIT 1`,
      params: [redeId, nome, dataNascimento.iso, ignorarId ?? null],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar({
    redeId,
    busca,
    apenasAtivos,
    offset,
    limite,
  }: ListarPacientesParams): Promise<Paciente[]> {
    const records = await this.db.query<PacienteModel>({
      sql: `SELECT * FROM pacientes
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::boolean IS NOT TRUE OR ativo IS TRUE)
               AND ${FILTRO_BUSCA}
             ORDER BY nome ASC
             LIMIT $4 OFFSET $5`,
      params: [redeId, apenasAtivos ?? false, busca ?? null, limite, offset],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async contar({ redeId, busca, apenasAtivos }: ContarPacientesParams): Promise<number> {
    const record = await this.db.queryOne<{ total: number }>({
      sql: `SELECT count(*)::int AS total FROM pacientes
             WHERE rede_id = $1
               AND deleted_at IS NULL
               AND ($2::boolean IS NOT TRUE OR ativo IS TRUE)
               AND ${FILTRO_BUSCA}`,
      params: [redeId, apenasAtivos ?? false, busca ?? null],
    });
    return record?.total ?? 0;
  }

  async salvar(paciente: Paciente): Promise<void> {
    const data = this.mapper.toPersistence({ entity: paciente });
    await this.db.query({
      sql: `INSERT INTO pacientes
              (id, rede_id, nome, cpf, data_nascimento, sexo, telefone, email, endereco,
               responsavel_nome, responsavel_telefone, alergias, condicoes_cronicas, observacoes,
               consentimento_lgpd, consentimento_em, ativo)
            VALUES ($1,$2,$3,$4,$5::date,$6::paciente_sexo,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17)`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.cpf,
        data.data_nascimento,
        data.sexo,
        data.telefone,
        data.email,
        data.endereco,
        data.responsavel_nome,
        data.responsavel_telefone,
        data.alergias,
        data.condicoes_cronicas,
        data.observacoes,
        data.consentimento_lgpd,
        data.consentimento_em,
        data.ativo,
      ],
    });
  }

  async atualizar(paciente: Paciente): Promise<void> {
    const data = this.mapper.toPersistence({ entity: paciente });
    await this.db.query({
      sql: `UPDATE pacientes
               SET nome = $3, cpf = $4, data_nascimento = $5::date, sexo = $6::paciente_sexo,
                   telefone = $7, email = $8, endereco = $9::jsonb, responsavel_nome = $10,
                   responsavel_telefone = $11, alergias = $12, condicoes_cronicas = $13,
                   observacoes = $14, consentimento_lgpd = $15, consentimento_em = $16,
                   ativo = $17, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.cpf,
        data.data_nascimento,
        data.sexo,
        data.telefone,
        data.email,
        data.endereco,
        data.responsavel_nome,
        data.responsavel_telefone,
        data.alergias,
        data.condicoes_cronicas,
        data.observacoes,
        data.consentimento_lgpd,
        data.consentimento_em,
        data.ativo,
      ],
    });
  }
}
