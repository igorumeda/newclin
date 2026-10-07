export type AgendamentoModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  profissional_id: string;
  paciente_id: string;
  tipo_atendimento_id: string;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  status: string;
  encaixe: boolean;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  checkin_em: Date | null;
  ordem_chegada: number | null;
  origem: string;
  criado_por: string | null;
  created_at: Date;
  updated_at: Date;
};

export type AgendamentoModelData = {
  id: string;
  rede_id: string;
  unidade_id: string;
  profissional_id: string;
  paciente_id: string;
  tipo_atendimento_id: string;
  data_hora_inicio: Date;
  data_hora_fim: Date;
  status: string;
  encaixe: boolean;
  observacoes: string | null;
  motivo_cancelamento: string | null;
  checkin_em: Date | null;
  ordem_chegada: number | null;
  origem: string;
  criado_por: string | null;
};
