/**
 * Read model de paciente exposto a outros contextos (agenda, prontuário,
 * documentos) — nunca expõe dados clínicos, apenas identificação e contato.
 */
export type PacienteResumo = {
  id: string;
  redeId: string;
  nome: string;
  nomeAbreviado: string;
  cpf: string;
  cpfFormatado: string;
  dataNascimento: string;
  sexo: string;
  sexoLabel: string;
  idade: number;
  menorDeIdade: boolean;
  telefone: string | null;
  email: string | null;
  responsavelNome: string | null;
  ativo: boolean;
};

export interface IPacienteLookup {
  findById(pacienteId: string): Promise<PacienteResumo | null>;
  listarPorIds(pacienteIds: string[]): Promise<PacienteResumo[]>;
}

export const PACIENTE_LOOKUP = Symbol('IPacienteLookup');
