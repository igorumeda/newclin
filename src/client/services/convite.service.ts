import { api } from './api-client.service';
import type { CadastroConviteParams } from '@/modules/user/domain/value-objects/cadastro-convite.vo';

export type ConviteDados = { nome: string; telefone: string; email: string };
type ConviteSessao =
  | { access_token: string; refresh_token: string }
  | { token_hash: string }
  | { code: string };
export const conviteService = {
  validar(params: ConviteSessao) {
    return api.post<{ validado: boolean }>('/api/auth/convite', { body: params });
  },
  obter() {
    return api.get<ConviteDados>('/api/auth/convite');
  },
  concluir(params: CadastroConviteParams) {
    return api.put<{ concluido: boolean }>('/api/auth/convite', { body: params });
  },
};
