export type AgendamentoModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  profissional_id: string;
  paciente_id: string;
  tipo_atendimento_id: string | null;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  encaixe: boolean;
  encaixe_justificativa: string | null;
  observacoes: string | null;
  check_in_em: string | null;
  iniciado_em: string | null;
  finalizado_em: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  confirmado_em: string | null;
  confirmado_por: string | null;
  criado_por: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AgendamentoModelData = {
  id: string;
  rede_id: string;
  unidade_id: string;
  profissional_id: string;
  paciente_id: string;
  tipo_atendimento_id: string | null;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  encaixe: boolean;
  encaixe_justificativa: string | null;
  observacoes: string | null;
  check_in_em: string | null;
  iniciado_em: string | null;
  finalizado_em: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  confirmado_em: string | null;
  confirmado_por: string | null;
  criado_por: string | null;
  ativo: boolean;
};

export const AGENDAMENTO_COLUMNS =
  'id, rede_id, unidade_id, profissional_id, paciente_id, tipo_atendimento_id, data_hora_inicio, data_hora_fim, status, encaixe, encaixe_justificativa, observacoes, check_in_em, iniciado_em, finalizado_em, cancelado_em, motivo_cancelamento, confirmado_em, confirmado_por, criado_por, ativo, created_at, updated_at, deleted_at';

export type ConflitoAgendaModel = {
  agendamento_id: string;
  paciente_id: string;
  paciente_nome: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  encaixe: boolean;
};

export type BloqueioHorarioModel = {
  bloqueio_id: string;
  tipo: string;
  motivo: string | null;
  inicio: string;
  fim: string;
};

export type HistoricoStatusModel = {
  id: string;
  status_anterior: string | null;
  status_novo: string;
  observacao: string | null;
  alterado_por: string | null;
  created_at: string;
};

export type TipoAtendimentoModel = {
  id: string;
  rede_id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  cor: string;
  requer_confirmacao: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TipoAtendimentoModelData = {
  id: string;
  rede_id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  cor: string;
  requer_confirmacao: boolean;
  ativo: boolean;
};

export const TIPO_ATENDIMENTO_COLUMNS =
  'id, rede_id, nome, descricao, duracao_minutos, cor, requer_confirmacao, ativo, created_at, updated_at, deleted_at';

export type BloqueioAgendaModel = {
  id: string;
  rede_id: string;
  profissional_id: string;
  unidade_id: string;
  tipo: string;
  motivo: string | null;
  inicio: string;
  fim: string;
  dia_inteiro: boolean;
  criado_por: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BloqueioAgendaModelData = {
  id: string;
  rede_id: string;
  profissional_id: string;
  unidade_id: string;
  tipo: string;
  motivo: string | null;
  inicio: string;
  fim: string;
  dia_inteiro: boolean;
  criado_por: string | null;
  ativo: boolean;
};

export const BLOQUEIO_COLUMNS =
  'id, rede_id, profissional_id, unidade_id, tipo, motivo, inicio, fim, dia_inteiro, criado_por, ativo, created_at, updated_at, deleted_at';
