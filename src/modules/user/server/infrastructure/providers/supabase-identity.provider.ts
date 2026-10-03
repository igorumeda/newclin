import type { SupabaseClient } from '@supabase/supabase-js';
import { IdentityProvider } from './identity-provider.base';
import type {
  AtualizarCredenciaisParams,
  CriarCredenciaisParams,
  CriarCredenciaisResultado,
} from '../../../domain/services/identity-provider.interface';
import { EmailAlreadyInUseError } from '../../../domain/errors/user-conflict.error';

export type SupabaseIdentityProviderDependencies = {
  serviceClient: SupabaseClient;
};

/**
 * Adapter de identidade sobre o Supabase Auth (service role).
 * Usa metadados (`raw_user_meta_data`) para que o trigger `on_auth_user_created`
 * já crie o profile com a rede, o papel e as unidades corretas.
 */
export class SupabaseIdentityProvider extends IdentityProvider {
  private readonly serviceClient: SupabaseClient;

  constructor(dependencies: SupabaseIdentityProviderDependencies) {
    super();
    this.serviceClient = dependencies.serviceClient;
  }

  async criarUsuario(params: CriarCredenciaisParams): Promise<CriarCredenciaisResultado> {
    const metadata = this.buildMetadata(params);

    // Quando uma senha inicial é informada, o usuário já nasce ativo no Auth.
    if (params.senhaInicial) {
      const { data, error } = await this.serviceClient.auth.admin.createUser({
        email: params.email,
        password: params.senhaInicial,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw this.translateError({ message: error.message, email: params.email });
      return { authUserId: data.user.id, conviteEnviado: false };
    }

    const { data, error } = await this.serviceClient.auth.admin.inviteUserByEmail(params.email, {
      data: metadata,
      redirectTo: params.redirectTo,
    });

    if (error || !data?.user) {
      throw this.translateError({
        message: error?.message ?? 'Falha ao convidar usuário',
        email: params.email,
      });
    }

    return { authUserId: data.user.id, conviteEnviado: true };
  }

  async atualizarUsuario(params: AtualizarCredenciaisParams): Promise<void> {
    const attributes: Record<string, unknown> = {};

    if (params.email) attributes.email = params.email;
    if (params.senha) attributes.password = params.senha;

    const metadata = this.buildMetadata({
      email: params.email ?? '',
      nome: params.nome ?? '',
      redeId: params.redeId ?? '',
      role: params.role ?? 'recepcao',
      unidadesAcesso: params.unidadesAcesso ?? [],
      profissionalId: params.profissionalId ?? null,
    });

    const { error } = await this.serviceClient.auth.admin.updateUserById(params.authUserId, {
      ...attributes,
      user_metadata: metadata,
    });

    if (error) {
      throw new Error(`Falha ao atualizar credenciais: ${error.message}`);
    }
  }

  async removerUsuario(authUserId: string): Promise<void> {
    const { error } = await this.serviceClient.auth.admin.deleteUser(authUserId);
    if (error) {
      throw new Error(`Falha ao remover credenciais: ${error.message}`);
    }
  }

  private buildMetadata(params: CriarCredenciaisParams): Record<string, unknown> {
    return {
      rede_id: params.redeId,
      role: params.role,
      nome: params.nome,
      unidades_acesso: params.unidadesAcesso,
      profissional_id: params.profissionalId,
    };
  }

  private translateError(params: { message: string; email: string }): Error {
    const normalized = params.message.toLowerCase();
    if (normalized.includes('already') || normalized.includes('registered') || normalized.includes('exists')) {
      return new EmailAlreadyInUseError({ email: params.email });
    }
    if (normalized.includes('rate limit')) {
      return new Error('Limite de convites atingido. Tente novamente em alguns minutos.');
    }
    return new Error(`Falha ao provisionar credenciais: ${params.message}`);
  }
}
