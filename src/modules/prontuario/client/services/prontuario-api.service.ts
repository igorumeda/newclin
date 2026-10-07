import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type {
  AdendoResponseDto,
  AnexoResponseDto,
  AtendimentoCompletoResponseDto,
  AtendimentoIniciadoResponseDto,
  AtendimentoResponseDto,
  TemplateResponseDto,
} from '../dtos/prontuario.response.dto';
import type {
  CamposFixosAtendimento,
  DadosPreenchidos,
  FontePagadora,
} from '../../domain/entities/atendimento.entity';
import type { SecaoTemplateEntrada } from '../../domain/value-objects/estrutura-template.vo';

export type ListarTemplatesParams = { especialidade?: string | null; apenasAtivos?: boolean };
export type ObterTemplateParams = { id: string };
export type SalvarTemplateParams = {
  nome: string;
  especialidade: string;
  descricao?: string | null;
  padrao?: boolean;
  secoes: SecaoTemplateEntrada[];
};
export type AtualizarTemplateParams = { id: string; dados: Partial<SalvarTemplateParams> & { ativo?: boolean } };
export type IniciarAtendimentoParams = {
  unidadeId: string;
  pacienteId: string;
  profissionalId?: string;
  agendamentoId?: string | null;
  templateId?: string | null;
  especialidade?: string | null;
  fontePagadora?: FontePagadora;
};
export type SalvarAtendimentoParams = {
  id: string;
  dadosPreenchidos?: DadosPreenchidos;
  camposFixos?: Partial<CamposFixosAtendimento>;
  fontePagadora?: FontePagadora;
};
export type ObterAtendimentoParams = { id: string };
export type ListarAtendimentosParams = {
  pacienteId?: string | null;
  profissionalId?: string | null;
  pagina?: number;
  porPagina?: number;
};
export type AdicionarAdendoParams = { id: string; conteudo: string; profissionalId?: string };
export type ListarAnexosParams = { pacienteId?: string | null; atendimentoId?: string | null };
export type RegistrarAnexoParams = {
  pacienteId: string;
  atendimentoId?: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageKey: string;
  descricao?: string | null;
};

export class ProntuarioApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listarTemplates(params: ListarTemplatesParams = {}): Promise<TemplateResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<TemplateResponseDto[]>>({
      path: '/api/v1/templates',
      params: {
        especialidade: params.especialidade ?? undefined,
        apenasAtivos: params.apenasAtivos,
      },
    });
    return resposta.data;
  }

  async obterTemplate({ id }: ObterTemplateParams): Promise<TemplateResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<TemplateResponseDto>>({
      path: `/api/v1/templates/${id}`,
    });
    return resposta.data;
  }

  async criarTemplate(params: SalvarTemplateParams): Promise<TemplateResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<TemplateResponseDto>,
      SalvarTemplateParams
    >({ path: '/api/v1/templates', body: params });
    return resposta.data;
  }

  async atualizarTemplate({ id, dados }: AtualizarTemplateParams): Promise<TemplateResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<TemplateResponseDto>,
      Partial<SalvarTemplateParams> & { ativo?: boolean }
    >({ path: `/api/v1/templates/${id}`, body: dados });
    return resposta.data;
  }

  async iniciarAtendimento(
    params: IniciarAtendimentoParams,
  ): Promise<AtendimentoIniciadoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AtendimentoIniciadoResponseDto>,
      IniciarAtendimentoParams
    >({ path: '/api/v1/atendimentos', body: params });
    return resposta.data;
  }

  async obterAtendimento({ id }: ObterAtendimentoParams): Promise<AtendimentoCompletoResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<AtendimentoCompletoResponseDto>>({
      path: `/api/v1/atendimentos/${id}`,
    });
    return resposta.data;
  }

  async listarAtendimentos(
    params: ListarAtendimentosParams = {},
  ): Promise<AtendimentoResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<AtendimentoResponseDto[]>>({
      path: '/api/v1/atendimentos',
      params: {
        pacienteId: params.pacienteId ?? undefined,
        profissionalId: params.profissionalId ?? undefined,
        pagina: params.pagina,
        porPagina: params.porPagina,
      },
    });
    return resposta.data;
  }

  async salvarAtendimento({ id, ...dados }: SalvarAtendimentoParams): Promise<AtendimentoResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<AtendimentoResponseDto>,
      Omit<SalvarAtendimentoParams, 'id'>
    >({ path: `/api/v1/atendimentos/${id}`, body: dados });
    return resposta.data;
  }

  async finalizarAtendimento({
    id,
    ...dados
  }: SalvarAtendimentoParams): Promise<AtendimentoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AtendimentoResponseDto>,
      Omit<SalvarAtendimentoParams, 'id'>
    >({ path: `/api/v1/atendimentos/${id}/finalizar`, body: dados });
    return resposta.data;
  }

  async adicionarAdendo({ id, ...dados }: AdicionarAdendoParams): Promise<AdendoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AdendoResponseDto>,
      Omit<AdicionarAdendoParams, 'id'>
    >({ path: `/api/v1/atendimentos/${id}/adendos`, body: dados });
    return resposta.data;
  }

  async listarAnexos(params: ListarAnexosParams): Promise<AnexoResponseDto[]> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<AnexoResponseDto[]>>({
      path: '/api/v1/anexos',
      params: {
        pacienteId: params.pacienteId ?? undefined,
        atendimentoId: params.atendimentoId ?? undefined,
      },
    });
    return resposta.data;
  }

  async registrarAnexo(params: RegistrarAnexoParams): Promise<AnexoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<AnexoResponseDto>,
      RegistrarAnexoParams
    >({ path: '/api/v1/anexos', body: params });
    return resposta.data;
  }
}

export const prontuarioApiService = new ProntuarioApiService({ httpClient });
