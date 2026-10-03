/**
 * Middleware de autenticação.
 * Valida a sessão do Supabase (cookies) e monta o RequestContext com os dados
 * de isolamento multi-tenant (rede + unidades + papel).
 */
import { Result } from '@core/domain/result';
import { UnauthorizedError } from '@core/domain/errors/unauthorized.error';
import { ForbiddenError } from '@core/domain/errors/forbidden.error';
import { createRouteClient } from '../config/supabase.config';
import type { AppRole, RequestContext } from '../api/request-context.types';

export type AuthenticateParams = {
  ip: string | null;
  userAgent: string | null;
};

export type ProfileRow = {
  id: string;
  rede_id: string;
  nome: string;
  email: string;
  role: AppRole;
  unidades_acesso: string[] | null;
  profissional_id: string | null;
  ativo: boolean;
};

export class SessaoInvalidaError extends UnauthorizedError {
  constructor(message = 'Sessão inválida ou expirada') {
    super({ message, code: 'SESSION_INVALID' });
    this.name = 'SessaoInvalidaError';
  }
}

export class UsuarioSemVinculoError extends ForbiddenError {
  constructor(message = 'Usuário sem vínculo ativo com uma rede. Contate o administrador.') {
    super({ message, code: 'USER_WITHOUT_TENANT' });
    this.name = 'UsuarioSemVinculoError';
  }
}

export async function authenticate(params: AuthenticateParams): Promise<Result<RequestContext>> {
  try {
    const supabase = createRouteClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return Result.fail(new SessaoInvalidaError());
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, rede_id, nome, email, role, unidades_acesso, profissional_id, ativo')
      .eq('auth_user_id', authData.user.id)
      .is('deleted_at', null)
      .maybeSingle<ProfileRow>();

    if (profileError || !profile || !profile.ativo) {
      return Result.fail(new UsuarioSemVinculoError());
    }

    return Result.ok({
      userId: profile.id,
      userName: profile.nome,
      userEmail: profile.email,
      role: profile.role,
      redeId: profile.rede_id,
      unidadesAcesso: profile.unidades_acesso ?? [],
      profissionalId: profile.profissional_id,
      ip: params.ip,
      userAgent: params.userAgent,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'SupabaseNotConfiguredError') {
      return Result.fail(new SessaoInvalidaError('Sistema não configurado. Verifique o arquivo .env.local.'));
    }
    throw error;
  }
}
