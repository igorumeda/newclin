/** Projeção de leitura com tudo que as mensagens precisam (spec §4.1 e §4.2). */
export type DestinatarioAgendamento = {
  redeId: string;
  agendamentoId: string;
  pacienteId: string;
  pacienteNome: string;
  pacienteEmail: string | null;
  pacienteTelefone: string | null;
  profissionalNome: string;
  unidadeNome: string;
  unidadeEndereco: string;
  unidadeTelefone: string | null;
  unidadeFusoHorario: string;
  redeNome: string;
  inicio: string;
  status: string;
  lembreteWhatsapp: boolean;
  lembreteEmail: boolean;
  antecedenciaLembreteHoras: number;
};

export type BuscarDestinatarioParams = { redeId: string; agendamentoId: string };
export type ListarParaLembreteParams = { de: string; ate: string; limite: number };

export interface IDestinatarioRepository {
  buscarPorAgendamento(params: BuscarDestinatarioParams): Promise<DestinatarioAgendamento | null>;
  listarParaLembrete(params: ListarParaLembreteParams): Promise<DestinatarioAgendamento[]>;
}

export const DESTINATARIO_REPOSITORY = Symbol('IDestinatarioRepository');
