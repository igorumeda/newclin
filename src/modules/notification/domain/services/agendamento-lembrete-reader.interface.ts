export type AgendamentoLembreteResumo = {
  agendamentoId: string;
  redeId: string;
  redeNome: string;
  unidadeId: string;
  unidadeNome: string;
  unidadeEndereco: string;
  unidadeTelefone: string | null;
  timezone: string;
  pacienteId: string;
  pacienteNome: string;
  telefone: string | null;
  email: string | null;
  profissionalNome: string;
  profissionalEspecialidade: string | null;
  dataHora: Date;
  status: string;
};

export type ListarParaLembreteParams = {
  redeId: string | null;
  janelaInicio: Date;
  janelaFim: Date;
  limite: number;
};

/** ACL de leitura dos agendamentos elegíveis a lembrete (worker de 24h). */
export interface IAgendamentoLembreteReader {
  listarParaLembrete(params: ListarParaLembreteParams): Promise<AgendamentoLembreteResumo[]>;
}

export const AGENDAMENTO_LEMBRETE_READER = Symbol('IAgendamentoLembreteReader');
