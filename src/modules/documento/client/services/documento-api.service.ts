import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { DocumentoResponseDto } from '../dtos/documento.response.dto';
import type { ConteudoDocumento } from '../../domain/entities/documento.entity';
import type { TipoDocumentoValue } from '../../domain/value-objects/tipo-documento.vo';

export type ListarDocumentosParams = {
  pacienteId?: string | null;
  atendimentoId?: string | null;
  tipo?: TipoDocumentoValue | null;
};
export type CriarDocumentoParams = {
  unidadeId: string;
  pacienteId: string;
  atendimentoId?: string | null;
  profissionalId?: string;
  tipo: TipoDocumentoValue;
  conteudo: ConteudoDocumento;
};
export type EmitirDocumentoParams = { id: string; conteudo?: ConteudoDocumento };
export type ObterDocumentoParams = { id: string };

export class DocumentoApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listar(params: ListarDocumentosParams = {}): Promise<DocumentoResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<DocumentoResponseDto[]>>({
      path: '/api/v1/documentos',
      params: {
        pacienteId: params.pacienteId ?? undefined,
        atendimentoId: params.atendimentoId ?? undefined,
        tipo: params.tipo ?? undefined,
      },
    });
    return resposta.data;
  }

  async obter({ id }: ObterDocumentoParams): Promise<DocumentoResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<DocumentoResponseDto>>({
      path: `/api/v1/documentos/${id}`,
    });
    return resposta.data;
  }

  async criar(params: CriarDocumentoParams): Promise<DocumentoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<DocumentoResponseDto>,
      CriarDocumentoParams
    >({ path: '/api/v1/documentos', body: params });
    return resposta.data;
  }

  async emitir({ id, conteudo }: EmitirDocumentoParams): Promise<DocumentoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<DocumentoResponseDto>,
      { conteudo?: ConteudoDocumento }
    >({ path: `/api/v1/documentos/${id}/emitir`, body: { conteudo } });
    return resposta.data;
  }
}

export const documentoApiService = new DocumentoApiService({ httpClient });
