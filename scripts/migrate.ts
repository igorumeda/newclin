/**
 * Executor de migrations.
 *
 *   npm run db:migrate
 *
 * Aplica, em ordem alfabética, todos os arquivos `.sql` da pasta `migrations/`
 * que ainda não foram registrados na tabela de controle `_migrations`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
loadDotenv({ path: '.env.local', override: true });

import { getDatabaseClient } from '../src/server/infrastructure/database/database.factory';
import { loadAppConfig } from '../src/server/config/env.config';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

type MigrationRow = { nome: string };

async function main(): Promise<void> {
  const appConfig = loadAppConfig();
  const database = getDatabaseClient();

  console.log(`→ Driver de banco: ${appConfig.database.driver}`);

  await database.runScript({
    sql: `CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL UNIQUE,
            aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
          );`,
  });

  const applied = await database.query<MigrationRow>({ sql: 'SELECT nome FROM _migrations' });
  const appliedNames = new Set(applied.map((row) => row.nome));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  let executed = 0;

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`  • ${file} (já aplicada)`);
      continue;
    }
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf-8');
    process.stdout.write(`  • ${file} ... `);
    await database.runScript({ sql: `BEGIN;\n${sql}\nCOMMIT;` });
    await database.query({
      sql: 'INSERT INTO _migrations (nome) VALUES ($1)',
      params: [file],
    });
    executed += 1;
    console.log('ok');
  }

  console.log(
    executed === 0
      ? '✔ Banco já está atualizado.'
      : `✔ ${executed} migration(s) aplicada(s) com sucesso.`,
  );

  await database.close();
}

main().catch(async (error) => {
  console.error('✖ Falha ao aplicar migrations:', error);
  process.exitCode = 1;
});
