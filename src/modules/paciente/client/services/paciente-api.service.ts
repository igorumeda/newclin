import { ApiService } from '@/client/services/api-service.base';
import type { ApiServiceDependencies } from '@/client/services/api-service.base';
import { httpClient } from '@/client/services/http-client';
import type { ApiSuccessResponse } from '@/shared/types/api.types';
import type { EnderecoPaciente } from '../../domain/entities/paciente.entity';
import type {
  ExportacaoPacienteResponseDto,
  ImportacaoResponseDto,
  LinhaImportacaoRequestDto,
  MapeamentoColunasRequestDto,
  PacienteResponseDto,
} from '../dtos/paciente.response.dto';

export type ListarPacientesParams = {
  busca?: string;
  apenasAtivos?: boolean;
  pagina?: number;
  porPagina?: number;
};
export type PaginacaoResposta = { page: number; perPage: number; total: number; totalPages: number };
export type ListaPacientes = { itens: PacienteResponseDto[]; meta: PaginacaoResposta };
export type SalvarPacienteParams = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: Partial<EnderecoPaciente>;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  alergias?: string[];
  condicoesCronicas?: string[];
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
};
export type ObterPacienteParams = { id: string };
export type AtualizarPacienteParams = { id: string; dados: Partial<SalvarPacienteParams> };
export type ImportarPacientesParams = {
  arquivoNome: string;
  mapeamento: MapeamentoColunasRequestDto;
  linhas: LinhaImportacaoRequestDto[];
  consentimentoLgpd?: boolean;
};

export class PacienteApiService extends ApiService {
  constructor(dependencies: ApiServiceDependencies) {
    super(dependencies);
  }

  async listar(params: ListarPacientesParams = {}): Promise<ListaPacientes> {
    const resposta = await this.httpClient.get<{
      data: PacienteResponseDto[];
      meta: PaginacaoResposta;
    }>({
      path: '/api/v1/pacientes',
      params: {
        busca: params.busca,
        apenasAtivos: params.apenasAtivos,
        pagina: params.pagina,
        porPagina: params.porPagina,
      },
    });
    return { itens: resposta.data, meta: resposta.meta };
  }

  async obter({ id }: ObterPacienteParams): Promise<PacienteResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<PacienteResponseDto>>({
      path: `/api/v1/pacientes/${id}`,
    });
    return resposta.data;
  }

  async criar(params: SalvarPacienteParams): Promise<PacienteResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<PacienteResponseDto>,
      SalvarPacienteParams
    >({ path: '/api/v1/pacientes', body: params });
    return resposta.data;
  }

  async atualizar({ id, dados }: AtualizarPacienteParams): Promise<PacienteResponseDto> {
    const resposta = await this.httpClient.patch<
      ApiSuccessResponse<PacienteResponseDto>,
      Partial<SalvarPacienteParams>
    >({ path: `/api/v1/pacientes/${id}`, body: dados });
    return resposta.data;
  }

  async excluir({ id }: ObterPacienteParams): Promise<void> {
    await this.httpClient.delete<ApiSuccessResponse<unknown>>({ path: `/api/v1/pacientes/${id}` });
  }

  async exportar({ id }: ObterPacienteParams): Promise<ExportacaoPacienteResponseDto> {
    const resposta = await this.httpClient.get<ApiSuccessResponse<ExportacaoPacienteResponseDto>>({
      path: `/api/v1/pacientes/${id}/exportar`,
    });
    return resposta.data;
  }

  async importar(params: ImportarPacientesParams): Promise<ImportacaoResponseDto> {
    const resposta = await this.httpClient.post<
      ApiSuccessResponse<ImportacaoResponseDto>,
      ImportarPacientesParams
    >({ path: '/api/v1/pacientes/importar', body: params });
    return resposta.data;
  }
}

export const pacienteApiService = new PacienteApiService({ httpClient });
