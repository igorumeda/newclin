import type { UsuarioDto } from '@/modules/user/application/mappers/usuario.mapper';
import type { AuditoriaDto } from '@/modules/audit/application/mappers/auditoria.mapper';
import { api } from './api-client.service';

export type { UsuarioDto, AuditoriaDto };

export type UsuarioPayload = {
  nome: string;
  email: string;
  role: string;
  telefone?: string | null;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
};

export const usuarioService = {
  async listar(params: { busca?: string; role?: string; ativo?: boolean; page?: number; perPage?: number }) {
    const resposta = await api.getWithMeta<UsuarioDto[]>('/api/usuarios', {
      query: {
        busca: params.busca,
        role: params.role,
        ativo: params.ativo === undefined ? undefined : String(params.ativo),
        page: params.page ?? 1,
        perPage: params.perPage ?? 50,
      },
    });

    return { items: resposta.data, meta: resposta.meta ?? {} };
  },

  async criar(input: UsuarioPayload): Promise<{ conviteEnviado: boolean }> {
    return api.post<{ conviteEnviado: boolean }>('/api/usuarios', { body: input });
  },

  async atualizar(usuarioId: string, input: Partial<Omit<UsuarioPayload, 'email'>>): Promise<UsuarioDto> {
    return api.put<UsuarioDto>(`/api/usuarios/${usuarioId}`, { body: input });
  },

  async inativar(usuarioId: string): Promise<UsuarioDto> {
    return api.post<UsuarioDto>(`/api/usuarios/${usuarioId}/inativar`);
  },

  async reativar(usuarioId: string): Promise<UsuarioDto> {
    return api.post<UsuarioDto>(`/api/usuarios/${usuarioId}/reativar`);
  },
};

export const auditoriaService = {
  async listar(params: {
    entidade?: string;
    acao?: string;
    usuarioId?: string;
    registroId?: string;
    de?: string;
    ate?: string;
    page?: number;
    perPage?: number;
  }) {
    const resposta = await api.getWithMeta<AuditoriaDto[]>('/api/auditoria', {
      query: { ...params, page: params.page ?? 1, perPage: params.perPage ?? 30 },
    });

    return { items: resposta.data, meta: resposta.meta ?? {} };
  },
};
