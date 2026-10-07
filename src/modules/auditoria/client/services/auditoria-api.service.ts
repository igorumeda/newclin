import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { RegistroAuditoriaResponseDto } from '../dtos/auditoria.response.dto';
import type { AcessoProntuarioRegistro } from '../../domain/repositories/auditoria-repository.interface';

export type ListarAuditoriaParams = {
  usuarioId?: string | null;
  entidade?: string | null;
  acao?: string | null;
  de?: string | null;
  ate?: string | null;
  pagina?: number;
  porPagina?: number;
};
export type PaginacaoAuditoria = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
export type ListaAuditoria = { itens: RegistroAuditoriaResponseDto[]; meta: PaginacaoAuditoria };
export type ListarAcessosParams = { pacienteId?: string | null; limite?: number };

export class AuditoriaApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listar(params: ListarAuditoriaParams = {}): Promise<ListaAuditoria> {
    const resposta = await this.httpClient.get<{
      data: RegistroAuditoriaResponseDto[];
      meta: PaginacaoAuditoria;
    }>({
      path: '/api/v1/auditoria',
      params: {
        usuarioId: params.usuarioId ?? undefined,
        entidade: params.entidade ?? undefined,
        acao: params.acao ?? undefined,
        de: params.de ?? undefined,
        ate: params.ate ?? undefined,
        pagina: params.pagina,
        porPagina: params.porPagina,
      },
    });
    return { itens: resposta.data, meta: resposta.meta };
  }

  async listarAcessosProntuario(
    params: ListarAcessosParams = {},
  ): Promise<AcessoProntuarioRegistro[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<AcessoProntuarioRegistro[]>>({
      path: '/api/v1/auditoria/prontuarios',
      params: { pacienteId: params.pacienteId ?? undefined, limite: params.limite },
    });
    return resposta.data;
  }
}

export const auditoriaApiService = new AuditoriaApiService({ httpClient });
