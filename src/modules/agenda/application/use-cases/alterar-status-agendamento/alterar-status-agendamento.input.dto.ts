export type AlterarStatusAgendamentoInputDto = {
  redeId: string;
  id: string;
  status: string;
  motivo?: string | null;
};
