export type QueryParams = { sql: string; params?: readonly unknown[] };
export type TransactionCallback<T> = (client: DatabaseClient) => Promise<T>;
export type TenantScopeParams<T> = { redeId: string; callback: TransactionCallback<T> };

export type RunScriptParams = { sql: string };

export interface IDatabaseClient {
  query<T>(params: QueryParams): Promise<T[]>;
  runScript(params: RunScriptParams): Promise<void>;
  queryOne<T>(params: QueryParams): Promise<T | null>;
  execute(params: QueryParams): Promise<number>;
  transaction<T>(callback: TransactionCallback<T>): Promise<T>;
  withTenant<T>(params: TenantScopeParams<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Base de acesso ao banco. Todas as implementações concretas (PostgreSQL de
 * produção ou PGlite de desenvolvimento) herdam desta classe.
 */
export abstract class DatabaseClient implements IDatabaseClient {
  abstract query<T>(params: QueryParams): Promise<T[]>;
  /** Executa um script SQL com múltiplos comandos (usado pelas migrations). */
  abstract runScript(params: RunScriptParams): Promise<void>;
  abstract transaction<T>(callback: TransactionCallback<T>): Promise<T>;
  abstract close(): Promise<void>;

  async queryOne<T>(params: QueryParams): Promise<T | null> {
    const rows = await this.query<T>(params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(params: QueryParams): Promise<number> {
    const rows = await this.query<unknown>(params);
    return rows.length;
  }

  /**
   * Executa o callback dentro de uma transação com `app.rede_id` configurado.
   * É o mecanismo que ativa as políticas de RLS (migrations/0009_rls.sql).
   */
  async withTenant<T>({ redeId, callback }: TenantScopeParams<T>): Promise<T> {
    return this.transaction(async (client) => {
      await client.query({
        sql: "SELECT set_config('app.rede_id', $1, true)",
        params: [redeId],
      });
      return callback(client);
    });
  }
}

export const DATABASE_CLIENT = Symbol('IDatabaseClient');
