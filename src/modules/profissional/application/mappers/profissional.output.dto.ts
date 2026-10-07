export type HorarioAtendimentoOutputDto = {
  id: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  rotuloDiaSemana: string;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
};

export type ProfissionalOutputDto = {
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
