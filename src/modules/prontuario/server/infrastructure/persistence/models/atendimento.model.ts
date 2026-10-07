import type { DadosPreenchidos } from '../../../../domain/entities/atendimento.entity';

export type AtendimentoModel = {
  id: string;
  rede_id: string;
  unidade_id: string;
  agendamento_id: string | null;
  paciente_id: string;
  profissional_id: string;
  template_id: string | null;
  template_versao: number | null;
  dados_preenchidos: DadosPreenchidos;
  queixa_principal: string | null;
  anamnese: string | null;
  exame_fisico: string | null;
  hipotese_diagnostica: string | null;
  cid10: string | null;
  conduta: string | null;
  fonte_pagadora: string;
  status: string;
  iniciado_em: Date;
  finalizado_em: Date | null;
  created_at: Date;
  updated_at: Date;
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
  dados_preenchidos: string;
  queixa_principal: string | null;
  anamnese: string | null;
  exame_fisico: string | null;
  hipotese_diagnostica: string | null;
  cid10: string | null;
  conduta: string | null;
  fonte_pagadora: string;
  status: string;
  iniciado_em: Date;
  finalizado_em: Date | null;
};

export type AdendoModel = {
  id: string;
  rede_id: string;
  atendimento_id: string;
  profissional_id: string;
  usuario_id: string | null;
  conteudo: string;
  created_at: Date;
};
