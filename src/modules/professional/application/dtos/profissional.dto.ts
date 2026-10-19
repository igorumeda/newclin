export type HorarioDto = {
  id: string;
  unidadeId: string;
  diaSemana: number;
  diaSemanaLabel: string;
  horaInicio: string;
  horaFim: string;
  duracaoSlotMinutos: number;
  intervaloMinutos: number;
};

export type ProfissionalDto = {
  id: string;
  redeId: string;
  nome: string;
  conselhoClasse: string;
  numeroConselho: string;
  ufConselho: string | null;
  registroFormatado: string;
  cpf: string | null;
  especialidade: string | null;
  registroEspecialista: string | null;
  telefone: string | null;
  email: string | null;
  corAgenda: string;
  observacoes: string | null;
  ativo: boolean;
  unidades: string[];
  horarios: HorarioDto[];
  createdAt: string;
};

export type ListarProfissionaisInputDto = {
  redeId: string;
  busca?: string | null;
  especialidade?: string | null;
  unidadeId?: string | null;
  ativo?: boolean | null;
  incluirHorarios?: boolean;
};

export type ListarProfissionaisOutputDto = { items: ProfissionalDto[] };

export type CriarProfissionalInputDto = {
  redeId: string;
  nome: string;
  conselhoClasse: string;
  numeroConselho: string;
  ufConselho?: string | null;
  cpf?: string | null;
  especialidade?: string | null;
  registroEspecialista?: string | null;
  telefone?: string | null;
  email?: string | null;
  corAgenda?: string;
  observacoes?: string | null;
  unidades?: string[];
};

export type CriarProfissionalOutputDto = ProfissionalDto;

export type AtualizarProfissionalInputDto = {
  profissionalId: string;
  nome?: string;
  conselhoClasse?: string;
  numeroConselho?: string;
  ufConselho?: string | null;
  cpf?: string | null;
  especialidade?: string | null;
  registroEspecialista?: string | null;
  telefone?: string | null;
  email?: string | null;
  corAgenda?: string;
  observacoes?: string | null;
};

export type AtualizarProfissionalOutputDto = ProfissionalDto;

export type InativarProfissionalInputDto = { profissionalId: string; reativar?: boolean };

export type InativarProfissionalOutputDto = ProfissionalDto;

export type DefinirHorariosInputDto = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  horarios: {
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
    duracaoSlotMinutos?: number;
    intervaloMinutos?: number;
  }[];
};

export type DefinirHorariosOutputDto = { horarios: HorarioDto[] };

export type DefinirUnidadesProfissionalInputDto = {
  redeId: string;
  profissionalId: string;
  unidadeIds: string[];
};

export type DefinirUnidadesProfissionalOutputDto = { unidades: string[] };
