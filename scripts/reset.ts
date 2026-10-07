/**
 * Apaga completamente o schema público e o controle de migrations.
 *
 *   npm run db:reset   (reset + migrate + seed)
 *
 * ATENÇÃO: destrutivo. Nunca execute em produção.
 */
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
loadDotenv({ path: '.env.local', override: true });

import { getDatabaseClient } from '../src/server/infrastructure/database/database.factory';
import { loadAppConfig } from '../src/server/config/env.config';

async function main(): Promise<void> {
  const appConfig = loadAppConfig();
  if (appConfig.isProduction) {
    throw new Error('Reset bloqueado: NODE_ENV=production');
  }

  const database = getDatabaseClient();
  console.log(`→ Limpando schema public (driver ${appConfig.database.driver})`);
  await database.runScript({
    sql: 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
  });
  console.log('✔ Schema recriado.');
  await database.close();
}

main().catch((error) => {
  console.error('✖ Falha ao resetar o banco:', error);
  process.exitCode = 1;
});
