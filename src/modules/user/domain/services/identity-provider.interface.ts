/**
 * Porta de identidade (Supabase Auth).
 * O domínio não conhece o provedor: apenas o contrato de provisionamento de
 * credenciais. A implementação vive em `server/infrastructure/providers`.
 */
import type { AppRole } from '../value-objects/role.vo';

export type CriarCredenciaisParams = {
  email: string;
  nome: string;
  redeId: string;
  role: AppRole;
  unidadesAcesso: string[];
  profissionalId: string | null;
  redirectTo?: string;
  senhaInicial?: string;
};

export type CriarCredenciaisResultado = {
  authUserId: string;
  conviteEnviado: boolean;
};

export type AtualizarCredenciaisParams = {
  authUserId: string;
  email?: string;
  nome?: string;
  redeId?: string;
  role?: AppRole;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  senha?: string;
};

export interface IIdentityProvider {
  criarUsuario(params: CriarCredenciaisParams): Promise<CriarCredenciaisResultado>;
  atualizarUsuario(params: AtualizarCredenciaisParams): Promise<void>;
  removerUsuario(authUserId: string): Promise<void>;
}

export const IDENTITY_PROVIDER = Symbol('IIdentityProvider');
