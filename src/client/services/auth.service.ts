import type { UsuarioDto } from '@/modules/user/application/mappers/usuario.mapper';
import { api } from './api-client.service';

export type PerfilAtual = {
  usuario: UsuarioDto;
  permissoes: string[];
};

export type LoginInput = { email: string; senha: string };

export type LoginOutput = PerfilAtual & { redirectTo: string };

export const authService = {
  async login(input: LoginInput): Promise<LoginOutput> {
    return api.post<LoginOutput>('/api/auth/login', { body: input });
  },

  async logout(): Promise<void> {
    await api.post<{ sucesso: boolean }>('/api/auth/logout');
  },

  async perfil(): Promise<PerfilAtual> {
    return api.get<PerfilAtual>('/api/auth/perfil');
  },
};
