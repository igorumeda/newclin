/**
 * Leitura e escrita do cookie de sessão. Fica no bootstrap porque conecta
 * configuração, provider de token e o runtime HTTP do Next.js.
 */
import { cookies } from 'next/headers';
import { loadAppConfig } from '@/server/config/env.config';
import { JwtTokenProvider } from '@/modules/auth/server/infrastructure/providers/jwt-token.provider';
import type { SessaoPayload } from '@/modules/auth/domain/services/token-provider.interface';
import type { AuthenticatedUser } from '@/server/api/http.types';

export type DefinirSessaoParams = { token: string; expiraEmHoras: number };

function tokenProvider(): JwtTokenProvider {
  return new JwtTokenProvider({ secret: loadAppConfig().auth.jwtSecret });
}

export async function lerSessao(): Promise<AuthenticatedUser | null> {
  const config = loadAppConfig();
  const token = cookies().get(config.auth.cookieName)?.value;
  if (!token) return null;

  const payload = await tokenProvider().verificar({ token });
  if (!payload) return null;

  return toUsuarioAutenticado(payload);
}

export function toUsuarioAutenticado(payload: SessaoPayload): AuthenticatedUser {
  return {
    id: payload.usuarioId,
    redeId: payload.redeId,
    nome: payload.nome,
    email: payload.email,
    role: payload.role,
    unidadesAcesso: payload.unidadesAcesso,
    profissionalId: payload.profissionalId,
  };
}

export function definirCookieSessao({ token, expiraEmHoras }: DefinirSessaoParams): void {
  const config = loadAppConfig();
  cookies().set({
    name: config.auth.cookieName,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
    maxAge: expiraEmHoras * 3600,
  });
}

export function limparCookieSessao(): void {
  const config = loadAppConfig();
  cookies().set({
    name: config.auth.cookieName,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
    maxAge: 0,
  });
}
