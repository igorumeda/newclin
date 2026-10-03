export type DadosNotificacaoAgendamento = {
  redeId: string;
  redeNome: string;
  agendamentoId: string;
  data: string;
  hora: string;
  profissionalNome: string;
  profissionalEspecialidade?: string | null;
  paciente: {
    pacienteId: string;
    pacienteNome: string;
    telefone?: string | null;
    email?: string | null;
  };
  unidade: {
    nome: string;
    enderecoCompleto: string;
    telefone?: string | null;
  };
  createdBy?: string | null;
};

export type ResultadoEnfileiramento = {
  enfileiradas: number;
  canalEscolhido: string | null;
  motivo: string | null;
};

/**
 * Porta de saída da agenda para notificação do paciente (§4.1/§4.2).
 * O adaptador concreto envolve o dispatcher do módulo de notificações, mantendo
 * a agenda independente de canais, modelos e provedores.
 */
export interface IAgendaNotificacaoPort {
  confirmacaoAgendamento(dados: DadosNotificacaoAgendamento): Promise<ResultadoEnfileiramento>;
  lembreteAgendamento(dados: DadosNotificacaoAgendamento): Promise<ResultadoEnfileiramento>;
  cancelamentoAgendamento(
    dados: DadosNotificacaoAgendamento,
    motivo?: string | null,
  ): Promise<ResultadoEnfileiramento>;
  cancelarNotificacoesPendentes(params: {
    agendamentoId: string;
    motivo: string;
  }): Promise<number>;
}

export const AGENDA_NOTIFICACAO_PORT = Symbol('IAgendaNotificacaoPort');
