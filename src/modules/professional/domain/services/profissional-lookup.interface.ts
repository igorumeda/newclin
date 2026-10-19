/**
 * Read model de profissional para outros contextos (agenda, relatórios,
 * prontuário). Implementado como Anti-Corruption Layer no módulo professional.
 */
export type ProfissionalResumo = {
  id: string;
  nome: string;
  especialidade: string | null;
  registroFormatado: string;
  corAgenda: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

export type HorarioResumo = {
  id: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  duracaoSlotMinutos: number;
  intervaloMinutos: number;
};

export interface IProfissionalLookup {
  findById(profissionalId: string): Promise<ProfissionalResumo | null>;
  listarAtivos(redeId: string, unidadeId?: string | null): Promise<ProfissionalResumo[]>;
  listarHorarios(params: {
    profissionalId: string;
    unidadeId?: string | null;
  }): Promise<HorarioResumo[]>;
}

export const PROFISSIONAL_LOOKUP = Symbol('IProfissionalLookup');
