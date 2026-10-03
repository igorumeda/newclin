import type { TemplateProntuario } from '../entities/template-prontuario.entity';
import type { Atendimento, StatusAtendimento } from '../entities/atendimento.entity';
import type { Evolucao } from '../entities/evolucao.entity';
import type { Anexo } from '../entities/anexo.entity';

export type TemplateId = string;
export type AtendimentoId = string;
export type AnexoId = string;

export type ListarTemplatesFiltro = {
  redeId: string;
  especialidade?: string | null;
  busca?: string | null;
  somenteAtivos?: boolean;
  incluirPadrao?: boolean;
};

export interface ITemplateProntuarioRepository {
  findById(id: TemplateId): Promise<TemplateProntuario | null>;
  listar(filtro: ListarTemplatesFiltro): Promise<TemplateProntuario[]>;
  listarEspecialidades(redeId: string): Promise<string[]>;
  save(template: TemplateProntuario): Promise<void>;
  update(template: TemplateProntuario): Promise<void>;
  existsByNome(params: { redeId: string; nome: string; ignorarId?: string | null }): Promise<boolean>;
}

export const TEMPLATE_PRONTUARIO_REPOSITORY = Symbol('ITemplateProntuarioRepository');

export type ListarAtendimentosFiltro = {
  redeId: string;
  unidadeId?: string | null;
  pacienteId?: string | null;
  profissionalId?: string | null;
  de?: string | null;
  ate?: string | null;
  status?: StatusAtendimento[] | null;
  page?: number;
  perPage?: number;
};

export type ListarAtendimentosResultado = {
  items: Atendimento[];
  total: number;
};

export interface IAtendimentoRepository {
  findById(id: AtendimentoId): Promise<Atendimento | null>;
  findByAgendamentoId(agendamentoId: string): Promise<Atendimento | null>;
  listar(filtro: ListarAtendimentosFiltro): Promise<ListarAtendimentosResultado>;
  save(atendimento: Atendimento): Promise<void>;
  update(atendimento: Atendimento): Promise<void>;
  /** Adendos e atendimentos do paciente, do mais recente para o mais antigo. */
  listarPorPaciente(params: {
    redeId: string;
    pacienteId: string;
    limite?: number;
  }): Promise<Atendimento[]>;
}

export const ATENDIMENTO_REPOSITORY = Symbol('IAtendimentoRepository');

export interface IEvolucaoRepository {
  listarPorAtendimento(atendimentoId: AtendimentoId): Promise<Evolucao[]>;
  save(evolucao: Evolucao): Promise<void>;
}

export const EVOLUCAO_REPOSITORY = Symbol('IEvolucaoRepository');

export type ListarAnexosFiltro = {
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
};

export interface IAnexoRepository {
  findById(id: AnexoId): Promise<Anexo | null>;
  listar(filtro: ListarAnexosFiltro): Promise<Anexo[]>;
  save(anexo: Anexo): Promise<void>;
  softDelete(id: AnexoId): Promise<void>;
}

export const ANEXO_REPOSITORY = Symbol('IAnexoRepository');
