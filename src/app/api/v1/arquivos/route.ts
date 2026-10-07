/**
 * Entrega de arquivos do driver de storage local por URL assinada
 * (HMAC + expiração). Em produção com S3 o próprio provedor assina a URL.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loadAppConfig } from '@/server/config/env.config';
import { assinarChaveStorage } from '@/server/infrastructure/storage/local-filesystem.storage';
import { createStorageClient } from '@/server/infrastructure/storage/storage.factory';
import { lerSessao } from '@/server/bootstrap/session';

const TIPOS_POR_EXTENSAO: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
};

function tipoDoArquivo(chave: string): string {
  const extensao = chave.split('.').pop()?.toLowerCase() ?? '';
  return TIPOS_POR_EXTENSAO[extensao] ?? 'application/octet-stream';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await lerSessao();
  if (!usuario) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada' } },
      { status: 401 },
    );
  }

  const config = loadAppConfig();
  const chave = request.nextUrl.searchParams.get('chave') ?? '';
  const expiraEm = Number(request.nextUrl.searchParams.get('expiraEm') ?? 0);
  const assinatura = request.nextUrl.searchParams.get('assinatura') ?? '';

  const esperada = assinarChaveStorage({
    chave,
    expiraEm,
    segredo: config.storage.signingSecret,
  });

  if (assinatura !== esperada || expiraEm < Math.floor(Date.now() / 1000)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Link expirado ou inválido' } },
      { status: 403 },
    );
  }
  if (!chave.includes(`/${usuario.redeId}/`)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Arquivo de outra rede' } },
      { status: 403 },
    );
  }

  const storage = createStorageClient({ config: config.storage });
  const arquivo = await storage.obter({ chave });
  if (!arquivo) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Arquivo não encontrado' } },
      { status: 404 },
    );
  }

  return new NextResponse(Buffer.from(arquivo.conteudo), {
    status: 200,
    headers: {
      'Content-Type': tipoDoArquivo(chave),
      'Content-Disposition': `inline; filename="${chave.split('/').pop()}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
