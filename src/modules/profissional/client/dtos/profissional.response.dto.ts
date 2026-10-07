export type ProfissionalResponseDto = {
  id: string;
  redeId: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  conselho: string;
  numeroConselho: string;
  ufConselho: string | null;
  registroFormatado: string;
  especialidade: string;
  corAgenda: string;
  unidades: string[];
  ativo: boolean;
};

export type HorarioAtendimentoResponseDto = {
  id: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  diaSemanaRotulo: string;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
};

export type HorarioRequestDto = {
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
};
