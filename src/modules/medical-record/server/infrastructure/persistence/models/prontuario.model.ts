import type { DadosPreenchidos } from '../../../../domain/value-objects/dados-prontuario.vo';
import type { EstruturaTemplateJSON } from '../../../../domain/value-objects/estrutura-template.vo';

// ── Templates ───────────────────────────────────────────────────────────────
export type TemplateProntuarioModel = {
  id: string;
  rede_id: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  estrutura: EstruturaTemplateJSON;
  versao: number;
  origem: string;
  template_base_id: string | null;
  is_padrao: boolean;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TemplateProntuarioModelData = {
  id: string;
  rede_id: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  estrutura: EstruturaTemplateJSON;
  versao: number;
  origem: string;
  template_base_id: string | null;
  is_padrao: boolean;
  ativo: boolean;
  created_by: string | null;
};

export const TEMPLATE_PRONTUARIO_COLUMNS =
  'id, rede_id, nome, especialidade, descricao, estrutura, versao, origem, template_base_id, is_padrao, ativo, created_by, created_at, updated_at, deleted_at';

// ── Atendimentos ────────────────────────────────────────────────────────────
export type AtendimentoModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  agendamento_id: string | null;
  paciente_id: string;
  profissional_id: string;
  template_id: string | null;
  template_versao: number | null;
  tipo_atendimento_id: string | null;
  queixa_principal: string | null;
  anamnese: string | null;
  exame_fisico: string | null;
  hipotese_diagnostica: string | null;
  cid: string | null;
  conduta: string | null;
  dados_preenchidos: DadosPreenchidos;
  fonte_pagadora: string;
  status: string;
  iniciado_em: string;
  finalizado_em: string | null;
  finalizado_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AtendimentoModelData = {
  id: string;
  rede_id: string;
  unidade_id: string;
  agendamento_id: string | null;
  paciente_id: string;
  profissional_id: string;
  template_id: string | null;
  template_versao: number | null;
  tipo_atendimento_id: string | null;
  queixa_principal: string | null;
  anamnese: string | null;
  exame_fisico: string | null;
  hipotese_diagnostica: string | null;
  cid: string | null;
  conduta: string | null;
  dados_preenchidos: DadosPreenchidos;
  fonte_pagadora: string;
  status: string;
  iniciado_em: string;
  finalizado_em: string | null;
  finalizado_por: string | null;
  cancelado_em: string | null;
  motivo_cancelamento: string | null;
  created_by: string | null;
};

export const ATENDIMENTO_COLUMNS =
  'id, rede_id, unidade_id, agendamento_id, paciente_id, profissional_id, template_id, template_versao, tipo_atendimento_id, queixa_principal, anamnese, exame_fisico, hipotese_diagnostica, cid, conduta, dados_preenchidos, fonte_pagadora, status, iniciado_em, finalizado_em, finalizado_por, cancelado_em, motivo_cancelamento, created_by, created_at, updated_at, deleted_at';

// ── Evoluções ───────────────────────────────────────────────────────────────
export type EvolucaoModel = {
  id: string;
  rede_id: string;
  atendimento_id: string;
  paciente_id: string;
  profissional_id: string;
  tipo: string;
  conteudo: string;
  dados: DadosPreenchidos;
  assinado_em: string;
  created_by: string | null;
  created_at: string;
};

export type EvolucaoModelData = {
  id: string;
  rede_id: string;
  atendimento_id: string;
  paciente_id: string;
  profissional_id: string;
  tipo: string;
  conteudo: string;
  dados: DadosPreenchidos;
  assinado_em: string;
  created_by: string | null;
};

export const EVOLUCAO_COLUMNS =
  'id, rede_id, atendimento_id, paciente_id, profissional_id, tipo, conteudo, dados, assinado_em, created_by, created_at';

// ── Anexos ──────────────────────────────────────────────────────────────────
export type AnexoModel = {
  id: string;
  rede_id: string;
  paciente_id: string | null;
  atendimento_id: string | null;
  nome_arquivo: string;
  descricao: string | null;
  mime_type: string;
  tamanho_bytes: number;
  storage_bucket: string;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AnexoModelData = {
  id: string;
  rede_id: string;
  paciente_id: string | null;
  atendimento_id: string | null;
  nome_arquivo: string;
  descricao: string | null;
  mime_type: string;
  tamanho_bytes: number;
  storage_bucket: string;
  storage_path: string;
  uploaded_by: string | null;
};

export const ANEXO_COLUMNS =
  'id, rede_id, paciente_id, atendimento_id, nome_arquivo, descricao, mime_type, tamanho_bytes, storage_bucket, storage_path, uploaded_by, created_at, updated_at, deleted_at';
