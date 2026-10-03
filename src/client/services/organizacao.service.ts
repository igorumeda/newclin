import type {
  AtualizarOrganizacaoInputDto,
  AtualizarTemaInputDto,
  OrganizacaoDto,
  UnidadeDto,
} from '@/modules/organization/application/dtos/organizacao.dto';
import { api } from './api-client.service';

export type { OrganizacaoDto, UnidadeDto };

export type ListarUnidadesParams = {
  busca?: string;
  ativo?: boolean;
};

export type EnderecoPayload = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export type CriarUnidadePayload = {
  nome: string;
  cnes?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: EnderecoPayload;
  timezone?: string;
  observacoes?: string | null;
};

export const organizacaoService = {
  async obter(): Promise<OrganizacaoDto> {
    return api.get<OrganizacaoDto>('/api/organizacao');
  },

  async atualizar(input: Partial<AtualizarOrganizacaoInputDto>): Promise<OrganizacaoDto> {
    return api.put<OrganizacaoDto>('/api/organizacao', { body: input });
  },

  async atualizarTema(input: Omit<AtualizarTemaInputDto, 'redeId'>): Promise<OrganizacaoDto> {
    return api.put<OrganizacaoDto>('/api/organizacao/tema', { body: input });
  },

  /** Envia o logotipo como multipart (bucket `logos/{rede_id}/`) ou o remove. */
  async definirLogotipo(input: { arquivo?: File; remover?: boolean }): Promise<OrganizacaoDto> {
    const formData = new FormData();
    if (input.arquivo) formData.append('arquivo', input.arquivo);
    if (input.remover) formData.append('remover', 'true');

    return api.post<OrganizacaoDto>('/api/organizacao/logotipo', { body: formData });
  },

  async listarUnidades(params: ListarUnidadesParams = {}): Promise<UnidadeDto[]> {
    const resposta = await api.getWithMeta<UnidadeDto[]>('/api/unidades', {
      query: { busca: params.busca, ativo: params.ativo === undefined ? undefined : String(params.ativo) },
    });

    return resposta.data;
  },

  async criarUnidade(input: CriarUnidadePayload): Promise<UnidadeDto> {
    return api.post<UnidadeDto>('/api/unidades', { body: input });
  },

  async atualizarUnidade(unidadeId: string, input: Partial<CriarUnidadePayload>): Promise<UnidadeDto> {
    return api.put<UnidadeDto>(`/api/unidades/${unidadeId}`, { body: input });
  },

  async inativarUnidade(unidadeId: string): Promise<UnidadeDto> {
    return api.delete<UnidadeDto>(`/api/unidades/${unidadeId}`);
  },

  async reativarUnidade(unidadeId: string): Promise<UnidadeDto> {
    return api.post<UnidadeDto>(`/api/unidades/${unidadeId}/reativar`);
  },
};
