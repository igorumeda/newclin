import type {
  ImportarPacientesOutputDto,
  LinhaImportacaoPaciente,
  PacienteDto,
} from '@/modules/patient/application/dtos/paciente.dto';
import type { PacienteDuplicadoDetalhe } from '@/modules/patient/domain/errors/paciente.errors';
import { api } from './api-client.service';

export type { PacienteDto, LinhaImportacaoPaciente, PacienteDuplicadoDetalhe };

export type ListarPacientesParams = {
  termo?: string;
  somenteAtivos?: boolean;
  unidadeId?: string;
  page?: number;
  perPage?: number;
};

export type PacientePayload = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
  };
  responsavelNome?: string | null;
  responsavelCpf?: string | null;
  responsavelTelefone?: string | null;
  responsavelParentesco?: string | null;
  alergias?: string | null;
  condicoesCronicas?: string | null;
  observacoes?: string | null;
  consentimentoLgpd?: boolean;
  ignorarDuplicidade?: boolean;
};

export const pacienteService = {
  async listar(params: ListarPacientesParams = {}) {
    const resposta = await api.getWithMeta<PacienteDto[]>('/api/pacientes', {
      query: {
        termo: params.termo,
        unidadeId: params.unidadeId,
        somenteAtivos: params.somenteAtivos === undefined ? undefined : String(params.somenteAtivos),
        page: params.page ?? 1,
        perPage: params.perPage ?? 20,
      },
    });

    return {
      items: resposta.data,
      meta: (resposta.meta ?? {}) as { total?: number; page?: number; perPage?: number; totalPages?: number },
    };
  },

  async obter(pacienteId: string): Promise<PacienteDto> {
    return api.get<PacienteDto>(`/api/pacientes/${pacienteId}`);
  },

  async criar(input: PacientePayload): Promise<PacienteDto> {
    return api.post<PacienteDto>('/api/pacientes', { body: input });
  },

  async atualizar(pacienteId: string, input: Partial<PacientePayload>): Promise<PacienteDto> {
    return api.put<PacienteDto>(`/api/pacientes/${pacienteId}`, { body: input });
  },

  async inativar(pacienteId: string): Promise<PacienteDto> {
    return api.delete<PacienteDto>(`/api/pacientes/${pacienteId}`);
  },

  async reativar(pacienteId: string): Promise<PacienteDto> {
    return api.post<PacienteDto>(`/api/pacientes/${pacienteId}/reativar`);
  },

  async verificarDuplicidade(input: {
    cpf?: string | null;
    nome?: string | null;
    dataNascimento?: string | null;
    ignorarId?: string | null;
  }): Promise<{ duplicados: PacienteDuplicadoDetalhe[] }> {
    return api.post<{ duplicados: PacienteDuplicadoDetalhe[] }>('/api/pacientes/verificar-duplicidade', {
      body: input,
    });
  },

  async importar(input: {
    linhas: LinhaImportacaoPaciente[];
    consentimentoLgpd?: boolean;
  }): Promise<ImportarPacientesOutputDto['relatorio']> {
    return api.post<ImportarPacientesOutputDto['relatorio']>('/api/pacientes/importar', { body: input });
  },

  async exportarDados(pacienteId: string): Promise<Record<string, unknown>> {
    const resposta = await api.get<{ dados: Record<string, unknown> }>(
      `/api/pacientes/${pacienteId}/exportar`,
    );
    return resposta.dados;
  },
};
