import { DatabaseClient } from './database-client.base';
import type { QueryParams, RunScriptParams, TransactionCallback } from './database-client.base';
import type { DatabaseConfig } from '@/server/config/env.config';

type PgliteInstance = {
  query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  exec: (sql: string) => Promise<unknown>;
  close: () => Promise<void>;
};

export type PgliteClientDependencies = { config: DatabaseConfig };

/**
 * Driver de desenvolvimento: PostgreSQL embarcado (PGlite), usado quando
 * `DATABASE_URL` não está preenchida. Permite rodar migrations, seed e a
 * aplicação inteira sem um servidor PostgreSQL externo.
 */
export class PgliteDatabaseClient extends DatabaseClient {
  private readonly dataDir: string;
  private instance: PgliteInstance | null = null;
  private connecting: Promise<PgliteInstance> | null = null;

  constructor(dependencies: PgliteClientDependencies) {
    super();
    this.dataDir = dependencies.config.pgliteDataDir;
  }

  private async getInstance(): Promise<PgliteInstance> {
    if (this.instance) return this.instance;
    if (!this.connecting) {
      this.connecting = import('@electric-sql/pglite').then(async ({ PGlite }) => {
        const created = (await PGlite.create({
          dataDir: this.dataDir,
        })) as unknown as PgliteInstance;
        this.instance = created;
        return created;
      });
    }
    return this.connecting;
  }

  async query<T>({ sql, params = [] }: QueryParams): Promise<T[]> {
    const instance = await this.getInstance();
    const result = await instance.query<T>(sql, params as unknown[]);
    return result.rows;
  }

  async runScript({ sql }: RunScriptParams): Promise<void> {
    const instance = await this.getInstance();
    await instance.exec(sql);
  }

  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const instance = await this.getInstance();
    await instance.query('BEGIN');
    try {
      const output = await callback(this);
      await instance.query('COMMIT');
      return output;
    } catch (error) {
      await instance.query('ROLLBACK');
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
      this.connecting = null;
    }
  }
}
