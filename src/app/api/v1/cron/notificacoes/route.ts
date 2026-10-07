/**
 * Disparo da fila de notificações por cron HTTP (alternativa ao worker
 * `npm run worker:notificacoes`). Protegido por `CRON_SECRET`.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loadAppConfig } from '@/server/config/env.config';
import { ApplicationContainer } from '@/server/di/container';
import { getDatabaseClient } from '@/server/infrastructure/database/database.factory';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = loadAppConfig();
  const segredo =
    request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret');

  if (!config.notificacoes.cronSecret || segredo !== config.notificacoes.cronSecret) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Segredo de cron inválido' } },
      { status: 403 },
    );
  }

  const container = new ApplicationContainer({ db: getDatabaseClient() });

  const lembretes = await container.gerarLembretes.execute({
    antecedenciaHoras: config.notificacoes.lembreteAntecedenciaHoras,
  });
  const fila = await container.processarFilaNotificacoes.execute({
    maxTentativas: config.notificacoes.maxTentativas,
  });

  return NextResponse.json({
    data: {
      lembretes: lembretes.isSuccess ? lembretes.value : null,
      fila: fila.isSuccess ? fila.value : null,
    },
  });
}
