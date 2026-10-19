import type {
  ConteudoDocumento,
  DocumentoDto,
  PrevisualizarDocumentoOutputDto,
} from '@/modules/clinical-document/application/dtos/documento.dto';
import { api } from './api-client.service';

export type { ConteudoDocumento, DocumentoDto, PrevisualizarDocumentoOutputDto };

export type CriarDocumentoPayload = {
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  atendimentoId?: string | null;
  tipo: string;
  conteudo?: ConteudoDocumento;
};

export const documentoService = {
  async listar(params: {
    pacienteId?: string;
    atendimentoId?: string;
    profissionalId?: string;
    tipo?: string;
    status?: string;
    de?: string;
    ate?: string;
    page?: number;
    perPage?: number;
  }) {
    const resposta = await api.getWithMeta<DocumentoDto[]>('/api/documentos', {
      query: { ...params, page: params.page ?? 1, perPage: params.perPage ?? 20 },
    });

    return { items: resposta.data, meta: resposta.meta ?? {} };
  },

  async obter(documentoId: string): Promise<DocumentoDto> {
    return api.get<DocumentoDto>(`/api/documentos/${documentoId}`);
  },

  async previsualizar(input: CriarDocumentoPayload): Promise<PrevisualizarDocumentoOutputDto> {
    return api.post<PrevisualizarDocumentoOutputDto>('/api/documentos/previsualizar', { body: input });
  },

  async criar(input: CriarDocumentoPayload): Promise<DocumentoDto> {
    return api.post<DocumentoDto>('/api/documentos', { body: input });
  },

  async atualizarConteudo(documentoId: string, conteudo: ConteudoDocumento): Promise<DocumentoDto> {
    return api.put<DocumentoDto>(`/api/documentos/${documentoId}`, { body: { conteudo } });
  },

  async emitir(
    documentoId: string,
    input: { notificarPaciente?: boolean } = {},
  ): Promise<{ documento: DocumentoDto; notificacao: { enfileiradas: number } | null }> {
    return api.post<{ documento: DocumentoDto; notificacao: { enfileiradas: number } | null }>(
      `/api/documentos/${documentoId}/emitir`,
      { body: input },
    );
  },

  async cancelar(documentoId: string, motivo: string): Promise<DocumentoDto> {
    return api.post<DocumentoDto>(`/api/documentos/${documentoId}/cancelar`, { body: { motivo } });
  },

  async obterLink(documentoId: string): Promise<{ url: string | null; expiraEm: string | null }> {
    return api.get<{ url: string | null; expiraEm: string | null }>(`/api/documentos/${documentoId}/link`);
  },
};
