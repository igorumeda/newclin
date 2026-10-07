/**
 * Worker da fila de notificações (e-mail e WhatsApp).
 *
 *   npm run worker:notificacoes
 *
 * A cada ciclo: gera os lembretes das próximas consultas e processa a fila
 * pendente. Em serverless, use o endpoint POST /api/v1/cron/notificacoes.
 */
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
loadDotenv({ path: '.env.local', override: true });

import { ApplicationContainer } from '../src/server/di/container';
import { getDatabaseClient } from '../src/server/infrastructure/database/database.factory';
import { loadAppConfig } from '../src/server/config/env.config';

let encerrando = false;

async function executarCiclo(): Promise<void> {
  const config = loadAppConfig();
  const container = new ApplicationContainer({ db: getDatabaseClient() });

  const lembretes = await container.gerarLembretes.execute({
    antecedenciaHoras: config.notificacoes.lembreteAntecedenciaHoras,
  });
  if (lembretes.isFailure) {
    console.error('  ✖ lembretes:', lembretes.error.message);
  } else if (lembretes.value.criados > 0) {
    console.log(`  • lembretes criados: ${lembretes.value.criados}`);
  }

  const fila = await container.processarFilaNotificacoes.execute({
    maxTentativas: config.notificacoes.maxTentativas,
  });
  if (fila.isFailure) {
    console.error('  ✖ fila:', fila.error.message);
    return;
  }
  if (fila.value.processadas > 0) {
    console.log(
      `  • fila: ${fila.value.processadas} processada(s), ${fila.value.enviadas} enviada(s), ` +
        `${fila.value.falhas} falha(s), ${fila.value.fallbacks} fallback(s)`,
    );
  }
}

async function main(): Promise<void> {
  const config = loadAppConfig();
  if (!config.notificacoes.workerEnabled) {
    console.log('→ Worker desabilitado (NOTIFICACOES_WORKER_ENABLED=false).');
    return;
  }

  const intervaloMs = config.notificacoes.intervalSeconds * 1000;
  console.log(
    `→ Worker de notificações ativo (intervalo ${config.notificacoes.intervalSeconds}s, ` +
      `e-mail: ${config.smtp.driver}, whatsapp: ${config.whatsapp.provider})`,
  );

  process.on('SIGINT', () => {
    encerrando = true;
  });
  process.on('SIGTERM', () => {
    encerrando = true;
  });

  while (!encerrando) {
    try {
      await executarCiclo();
    } catch (erro) {
      console.error('✖ Falha no ciclo do worker:', erro);
    }
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }

  console.log('→ Worker encerrado.');
  await getDatabaseClient().close();
}

main().catch((error) => {
  console.error('✖ Worker interrompido:', error);
  process.exitCode = 1;
});
