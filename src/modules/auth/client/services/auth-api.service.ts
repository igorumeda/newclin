import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { SessaoResponseDto, UsuarioResponseDto } from '../dtos/usuario.response.dto';

export type SessaoUsuario = {
  id: string;
  redeId: string;
  nome: string;
  email: string;
  role: string;
  unidadesAcesso: string[];
  profissionalId: string | null;
};

export type EntrarParams = { email: string; senha: string };
export type ListarUsuariosParams = { busca?: string; incluirInativos?: boolean };
export type CriarUsuarioParams = {
  nome: string;
  email: string;
  senha: string;
  role: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
};
export type AtualizarUsuarioParams = { id: string; dados: Partial<CriarUsuarioParams> };
export type RemoverUsuarioParams = { id: string };

export class AuthApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async entrar(params: EntrarParams): Promise<SessaoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<SessaoResponseDto>,
      EntrarParams
    >({ path: '/api/v1/sessao', body: params });
    return resposta.data;
  }

  async sair(): Promise<void> {
    await this.httpClient.delete<ApiSuccessResponse<unknown>>({ path: '/api/v1/sessao' });
  }

  async sessaoAtual(): Promise<SessaoUsuario> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<SessaoUsuario>>({
      path: '/api/v1/sessao',
    });
    return resposta.data;
  }

  async listarUsuarios(params: ListarUsuariosParams): Promise<UsuarioResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<UsuarioResponseDto[]>>({
      path: '/api/v1/usuarios',
      params: { busca: params.busca, incluirInativos: params.incluirInativos },
    });
    return resposta.data;
  }

  async criarUsuario(params: CriarUsuarioParams): Promise<UsuarioResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<UsuarioResponseDto>,
      CriarUsuarioParams
    >({ path: '/api/v1/usuarios', body: params });
    return resposta.data;
  }

  async atualizarUsuario({ id, dados }: AtualizarUsuarioParams): Promise<UsuarioResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<UsuarioResponseDto>,
      Partial<CriarUsuarioParams>
    >({ path: `/api/v1/usuarios/${id}`, body: dados });
    return resposta.data;
  }

  async desativarUsuario({ id }: RemoverUsuarioParams): Promise<void> {
    await this.httpClient.delete<ApiSuccessResponse<unknown>>({ path: `/api/v1/usuarios/${id}` });
  }
}

export const authApiService = new AuthApiService({ httpClient });
