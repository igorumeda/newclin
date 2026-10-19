export type ProfissionalModel = {
  id: string;
  rede_id: string;
  nome: string;
  cpf: string | null;
  conselho_classe: string;
  numero_conselho: string;
  uf_conselho: string | null;
  especialidade: string | null;
  registro_especialista: string | null;
  telefone: string | null;
  email: string | null;
  cor_agenda: string;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProfissionalModelData = {
  id: string;
  rede_id: string;
  nome: string;
  cpf: string | null;
  conselho_classe: string;
  numero_conselho: string;
  uf_conselho: string | null;
  especialidade: string | null;
  registro_especialista: string | null;
  telefone: string | null;
  email: string | null;
  cor_agenda: string;
  observacoes: string | null;
  ativo: boolean;
};

export const PROFISSIONAL_COLUMNS =
  'id, rede_id, nome, cpf, conselho_classe, numero_conselho, uf_conselho, especialidade, registro_especialista, telefone, email, cor_agenda, observacoes, ativo, created_at, updated_at, deleted_at';

export type HorarioAtendimentoModel = {
  id: string;
  rede_id: string;
  profissional_id: string;
  unidade_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  duracao_slot_minutos: number;
  intervalo_minutos: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type HorarioAtendimentoModelData = {
  rede_id: string;
  profissional_id: string;
  unidade_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  duracao_slot_minutos: number;
  intervalo_minutos: number;
  ativo: boolean;
};

export const HORARIO_COLUMNS =
  'id, rede_id, profissional_id, unidade_id, dia_semana, hora_inicio, hora_fim, duracao_slot_minutos, intervalo_minutos, ativo, created_at, updated_at, deleted_at';

export type ProfissionalUnidadeModel = {
  id: string;
  profissional_id: string;
  unidade_id: string;
  ativo: boolean;
  deleted_at: string | null;
};
