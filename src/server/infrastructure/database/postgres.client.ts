import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { DatabaseClient } from './database-client.base';
import type { QueryParams, RunScriptParams, TransactionCallback } from './database-client.base';
import type { DatabaseConfig } from '@/server/config/env.config';

export type PostgresClientDependencies = { config: DatabaseConfig };
type PostgresTransactionDependencies = { client: PoolClient };

class PostgresTransactionClient extends DatabaseClient {
  private readonly client: PoolClient;

  constructor(dependencies: PostgresTransactionDependencies) {
    super();
    this.client = dependencies.client;
  }

  async query<T>({ sql, params = [] }: QueryParams): Promise<T[]> {
    const result = await this.client.query(sql, params as unknown[]);
    return result.rows as T[];
  }

  async runScript({ sql }: RunScriptParams): Promise<void> {
    await this.client.query(sql);
  }

  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    return callback(this);
  }

  async close(): Promise<void> {
    /* O encerramento é controlado pelo pool da conexão principal. */
  }
}

export class PostgresDatabaseClient extends DatabaseClient {
  private readonly pool: Pool;

  constructor(dependencies: PostgresClientDependencies) {
    super();
    this.pool = new Pool({
      connectionString: dependencies.config.url,
      max: dependencies.config.poolMax,
      ssl: dependencies.config.ssl ? { rejectUnauthorized: false } : undefined,
    });
  }

  async query<T>({ sql, params = [] }: QueryParams): Promise<T[]> {
    const result = await this.pool.query(sql, params as unknown[]);
    return result.rows as T[];
  }

  async runScript({ sql }: RunScriptParams): Promise<void> {
    await this.pool.query(sql);
  }

  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const connection = await this.pool.connect();
    const scoped = new PostgresTransactionClient({ client: connection });
    try {
      await connection.query('BEGIN');
      const output = await callback(scoped);
      await connection.query('COMMIT');
      return output;
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
