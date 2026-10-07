import { DatabaseClient } from './database-client.base';
import { PostgresDatabaseClient } from './postgres.client';
import { PgliteDatabaseClient } from './pglite.client';
import { loadAppConfig } from '@/server/config/env.config';

type GlobalWithDatabase = typeof globalThis & { __clinicaDatabase?: DatabaseClient };

/**
 * Instância única por processo. O cache em `globalThis` evita múltiplos pools
 * durante o hot-reload do Next.js em desenvolvimento.
 */
export function getDatabaseClient(): DatabaseClient {
  const globalRef = globalThis as GlobalWithDatabase;
  if (globalRef.__clinicaDatabase) return globalRef.__clinicaDatabase;

  const config = loadAppConfig();
  const client =
    config.database.driver === 'postgres'
      ? new PostgresDatabaseClient({ config: config.database })
      : new PgliteDatabaseClient({ config: config.database });

  globalRef.__clinicaDatabase = client;
  return client;
}
