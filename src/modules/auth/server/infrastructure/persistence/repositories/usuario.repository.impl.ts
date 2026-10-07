import { UsuarioRepository } from '../../../../domain/repositories/usuario-repository.base';
import type {
  BuscarPorEmailParams,
  BuscarUsuarioParams,
  ExisteEmailParams,
  ListarUsuariosParams,
} from '../../../../domain/repositories/usuario-repository.interface';
import type { Usuario } from '../../../../domain/entities/usuario.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { UsuarioPersistenceMapper } from '../mappers/usuario-persistence.mapper';
import type { UsuarioModel } from '../models/usuario.model';

export type UsuarioRepositoryDependencies = {
  db: DatabaseClient;
  mapper: UsuarioPersistenceMapper;
};

const SELECT_BASE = `
  SELECT u.*, COALESCE(
           (SELECT array_agg(uu.unidade_id::text)
              FROM usuario_unidades uu
             WHERE uu.usuario_id = u.id),
           ARRAY[]::text[]
         ) AS unidades_acesso
    FROM usuarios u
`;

export class UsuarioRepositoryImpl extends UsuarioRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: UsuarioPersistenceMapper;

  constructor(dependencies: UsuarioRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarUsuarioParams): Promise<Usuario | null> {
    const record = await this.db.queryOne<UsuarioModel>({
      sql: `${SELECT_BASE} WHERE u.id = $1 AND u.rede_id = $2 AND u.deleted_at IS NULL`,
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPorEmail({ email }: BuscarPorEmailParams): Promise<Usuario | null> {
    const record = await this.db.queryOne<UsuarioModel>({
      sql: `${SELECT_BASE} WHERE app_sem_acento(u.email) = app_sem_acento($1) AND u.deleted_at IS NULL`,
      params: [email.value],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar({ redeId, busca, incluirInativos }: ListarUsuariosParams): Promise<Usuario[]> {
    const records = await this.db.query<UsuarioModel>({
      sql: `${SELECT_BASE}
             WHERE u.rede_id = $1
               AND u.deleted_at IS NULL
               AND ($2::boolean IS TRUE OR u.ativo IS TRUE)
               AND ($3::text IS NULL
                    OR app_sem_acento(u.nome) LIKE '%' || app_sem_acento($3) || '%'
                    OR app_sem_acento(u.email) LIKE '%' || app_sem_acento($3) || '%')
             ORDER BY u.nome ASC`,
      params: [redeId, incluirInativos ?? true, busca ?? null],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async salvar(usuario: Usuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: usuario });
    await this.db.query({
      sql: `INSERT INTO usuarios
              (id, rede_id, nome, email, senha_hash, role, profissional_id, telefone,
               avatar_url, ativo, ultimo_acesso_em, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.email,
        data.senha_hash,
        data.role,
        data.profissional_id,
        data.telefone,
        data.avatar_url,
        data.ativo,
        data.ultimo_acesso_em,
        data.created_at,
        data.updated_at,
      ],
    });
    await this.sincronizarUnidades(usuario);
  }

  async atualizar(usuario: Usuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: usuario });
    await this.db.query({
      sql: `UPDATE usuarios
               SET nome = $3, email = $4, senha_hash = $5, role = $6, profissional_id = $7,
                   telefone = $8, avatar_url = $9, ativo = $10, ultimo_acesso_em = $11,
                   updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.nome,
        data.email,
        data.senha_hash,
        data.role,
        data.profissional_id,
        data.telefone,
        data.avatar_url,
        data.ativo,
        data.ultimo_acesso_em,
      ],
    });
    await this.sincronizarUnidades(usuario);
  }

  async existeEmail({ email, ignorarId }: ExisteEmailParams): Promise<boolean> {
    const record = await this.db.queryOne<{ total: number }>({
      sql: `SELECT count(*)::int AS total
              FROM usuarios
             WHERE app_sem_acento(email) = app_sem_acento($1)
               AND deleted_at IS NULL
               AND ($2::uuid IS NULL OR id <> $2::uuid)`,
      params: [email.value, ignorarId ?? null],
    });
    return (record?.total ?? 0) > 0;
  }

  private async sincronizarUnidades(usuario: Usuario): Promise<void> {
    await this.db.query({
      sql: 'DELETE FROM usuario_unidades WHERE usuario_id = $1',
      params: [usuario.id.toString()],
    });
    for (const unidadeId of usuario.unidadesAcesso) {
      await this.db.query({
        sql: `INSERT INTO usuario_unidades (usuario_id, unidade_id, rede_id)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING`,
        params: [usuario.id.toString(), unidadeId, usuario.redeId],
      });
    }
  }
}
