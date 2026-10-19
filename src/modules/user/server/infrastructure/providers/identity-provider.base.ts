import type {
  AtualizarCredenciaisParams,
  CriarCredenciaisParams,
  CriarCredenciaisResultado,
  IIdentityProvider,
} from '../../../domain/services/identity-provider.interface';

export abstract class IdentityProvider implements IIdentityProvider {
  abstract criarUsuario(params: CriarCredenciaisParams): Promise<CriarCredenciaisResultado>;
  abstract atualizarUsuario(params: AtualizarCredenciaisParams): Promise<void>;
  abstract removerUsuario(authUserId: string): Promise<void>;
}
