import { api } from './api-client.service';
import type { SenhaParams } from '@/modules/user/domain/value-objects/senha.vo';
type EnviarLinkParams = { email: string };
type SessaoRecuperacao =
  | { access_token: string; refresh_token: string }
  | { token_hash: string }
  | { code: string };
export const recuperacaoSenhaService = {
  solicitar(params: EnviarLinkParams) {
    return api.post<{ enviado: boolean }>('/api/auth/recuperar-senha', { body: params });
  },
  validar(params: SessaoRecuperacao) {
    return api.post<{ validado: boolean }>('/api/auth/redefinir-senha', { body: params });
  },
  obter() {
    return api.get<{ email: string }>('/api/auth/redefinir-senha');
  },
  redefinir(params: SenhaParams) {
    return api.put<{ concluido: boolean }>('/api/auth/redefinir-senha', { body: params });
  },
};
