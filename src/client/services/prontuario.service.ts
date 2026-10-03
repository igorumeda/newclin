import type {
  AnexoDto,
  AtendimentoDto,
  EvolucaoDto,
  TemplateProntuarioDto,
} from '@/modules/medical-record/application/dtos/prontuario.dto';
import type { DadosPreenchidos } from '@/modules/medical-record/domain/value-objects/dados-prontuario.vo';
import type { CampoEstrutura } from '@/modules/medical-record/domain/value-objects/campo-template.vo';
import type { SecaoEstruturaNormalizada } from '@/modules/medical-record/domain/value-objects/estrutura-template.vo';
import { api } from './api-client.service';

export type { AnexoDto, AtendimentoDto, EvolucaoDto, TemplateProntuarioDto, DadosPreenchidos };

export type AtendimentoDetalhe = {
  atendimento: AtendimentoDto;
  evolucoes: EvolucaoDto[];
  /** Estrutura do template usado — permite renderizar o formulário dinâmico. */
  estrutura: { secoes: SecaoEstruturaNormalizada[] } | null;
  camposFixos: CampoEstrutura[];
  /** Problemas de validação devolvidos pelo servidor na última operação. */
  problemas?: { campoId: string; rotulo: string; motivo: string }[];
};

export type { CampoEstrutura, SecaoEstruturaNormalizada };

export type CampsFixosPayload = {
  queixaPrincipal?: string | null;
  anamnese?: string | null;
  exameFisico?: string | null;
  hipoteseDiagnostica?: string | null;
  cid?: string | null;
  conduta?: string | null;
};

export const prontuarioService = {
  // ── Templates ────────────────────────────────────────────────────────────
  async listarTemplates(params: { especialidade?: string; busca?: string } = {}): Promise<{
    items: TemplateProntuarioDto[];
    especialidades: string[];
  }> {
    const resposta = await api.getWithMeta<TemplateProntuarioDto[]>('/api/templates-prontuario', {
      query: params,
    });

    return {
      items: resposta.data,
      especialidades: (resposta.meta?.especialidades as string[] | undefined) ?? [],
    };
  },

  async obterTemplate(templateId: string): Promise<TemplateProntuarioDto> {
    return api.get<TemplateProntuarioDto>(`/api/templates-prontuario/${templateId}`);
  },

  async criarTemplate(input: {
    nome: string;
    especialidade: string;
    descricao?: string | null;
    secoes: unknown[];
  }): Promise<TemplateProntuarioDto> {
    return api.post<TemplateProntuarioDto>('/api/templates-prontuario', { body: input });
  },

  async clonarTemplate(templateId: string, input: { nome: string; especialidade?: string }) {
    return api.post<TemplateProntuarioDto>(`/api/templates-prontuario/${templateId}/clonar`, { body: input });
  },

  async atualizarTemplate(
    templateId: string,
    input: { nome?: string; especialidade?: string; descricao?: string | null; secoes?: unknown[] },
  ): Promise<TemplateProntuarioDto> {
    return api.put<TemplateProntuarioDto>(`/api/templates-prontuario/${templateId}`, { body: input });
  },

  async inativarTemplate(templateId: string): Promise<TemplateProntuarioDto> {
    return api.delete<TemplateProntuarioDto>(`/api/templates-prontuario/${templateId}`);
  },

  async reativarTemplate(templateId: string): Promise<TemplateProntuarioDto> {
    return api.post<TemplateProntuarioDto>(`/api/templates-prontuario/${templateId}/reativar`);
  },

  // ── Atendimentos ─────────────────────────────────────────────────────────
  async listarAtendimentos(params: {
    pacienteId?: string;
    profissionalId?: string;
    unidadeId?: string;
    de?: string;
    ate?: string;
    status?: string;
    page?: number;
    perPage?: number;
  }) {
    const resposta = await api.getWithMeta<AtendimentoDto[]>('/api/atendimentos', {
      query: { ...params, page: params.page ?? 1, perPage: params.perPage ?? 20 },
    });

    return { items: resposta.data, meta: resposta.meta ?? {} };
  },

  async iniciarAtendimento(input: {
    unidadeId: string;
    pacienteId: string;
    profissionalId: string;
    agendamentoId?: string | null;
    tipoAtendimentoId?: string | null;
    templateId?: string | null;
    especialidade?: string | null;
    camposFixos?: CampsFixosPayload;
  }): Promise<AtendimentoDto> {
    return api.post<AtendimentoDto>('/api/atendimentos', { body: input });
  },

  async obterAtendimento(atendimentoId: string): Promise<AtendimentoDetalhe> {
    return api.get<AtendimentoDetalhe>(`/api/atendimentos/${atendimentoId}`);
  },

  async salvarRascunho(
    atendimentoId: string,
    input: { camposFixos?: CampsFixosPayload; dadosPreenchidos?: DadosPreenchidos; templateId?: string | null },
  ): Promise<{ atendimento: AtendimentoDto; avisos: string[] }> {
    return api.put<{ atendimento: AtendimentoDto; avisos: string[] }>(
      `/api/atendimentos/${atendimentoId}/rascunho`,
      { body: input },
    );
  },

  async finalizarAtendimento(atendimentoId: string): Promise<AtendimentoDto> {
    return api.post<AtendimentoDto>(`/api/atendimentos/${atendimentoId}/finalizar`);
  },

  async cancelarAtendimento(atendimentoId: string, motivo: string): Promise<AtendimentoDto> {
    return api.post<AtendimentoDto>(`/api/atendimentos/${atendimentoId}/cancelar`, { body: { motivo } });
  },

  async listarEvolucoes(atendimentoId: string): Promise<EvolucaoDto[]> {
    return api.get<EvolucaoDto[]>(`/api/atendimentos/${atendimentoId}/evolucoes`);
  },

  async adicionarAdendo(
    atendimentoId: string,
    input: { conteudo: string; tipo?: string },
  ): Promise<EvolucaoDto> {
    return api.post<EvolucaoDto>(`/api/atendimentos/${atendimentoId}/adendos`, { body: input });
  },

  // ── Anexos ───────────────────────────────────────────────────────────────
  async listarAnexos(params: { pacienteId?: string; atendimentoId?: string }): Promise<AnexoDto[]> {
    return api.get<AnexoDto[]>('/api/anexos', { query: params });
  },

  async enviarAnexo(input: {
    pacienteId: string;
    atendimentoId?: string | null;
    nomeArquivo: string;
    descricao?: string | null;
    mimeType: string;
    tamanhoBytes: number;
    conteudoBase64: string;
  }): Promise<AnexoDto> {
    return api.post<AnexoDto>('/api/anexos', { body: input });
  },

  async obterLinkAnexo(anexoId: string): Promise<{ url: string | null; expiraEm: string | null }> {
    return api.get<{ url: string | null; expiraEm: string | null }>(`/api/anexos/${anexoId}/link`);
  },

  async removerAnexo(anexoId: string): Promise<{ anexoId: string }> {
    return api.delete<{ anexoId: string }>(`/api/anexos/${anexoId}`);
  },
};
