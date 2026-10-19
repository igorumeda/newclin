export type NotificacaoModel = {
  id: string;
  rede_id: string;
  agendamento_id: string | null;
  paciente_id: string | null;
  atendimento_id: string | null;
  documento_id: string | null;
  canal: string;
  tipo: string;
  destinatario: string;
  remetente: string | null;
  assunto: string | null;
  conteudo: string;
  status: string;
  provider: string | null;
  provider_message_id: string | null;
  tentativas: number;
  ultimo_erro: string | null;
  agendada_para: string;
  enviada_em: string | null;
  entregue_em: string | null;
  respondida_em: string | null;
  resposta: string | null;
  resposta_acao: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NotificacaoModelData = {
  id: string;
  rede_id: string;
  agendamento_id: string | null;
  paciente_id: string | null;
  atendimento_id: string | null;
  documento_id: string | null;
  canal: string;
  tipo: string;
  destinatario: string;
  remetente: string | null;
  assunto: string | null;
  conteudo: string;
  status: string;
  provider: string | null;
  provider_message_id: string | null;
  tentativas: number;
  ultimo_erro: string | null;
  agendada_para: string;
  enviada_em: string | null;
  entregue_em: string | null;
  respondida_em: string | null;
  resposta: string | null;
  resposta_acao: string | null;
  created_by: string | null;
};

export const NOTIFICACAO_COLUMNS =
  'id, rede_id, agendamento_id, paciente_id, atendimento_id, documento_id, canal, tipo, destinatario, remetente, assunto, conteudo, status, provider, provider_message_id, tentativas, ultimo_erro, agendada_para, enviada_em, entregue_em, respondida_em, resposta, resposta_acao, created_by, created_at, updated_at, deleted_at';

export type ModeloMensagemModel = {
  id: string;
  rede_id: string;
  canal: string;
  tipo: string;
  assunto: string | null;
  corpo: string;
  ativo: boolean;
  is_padrao: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ModeloMensagemModelData = {
  id: string;
  rede_id: string;
  canal: string;
  tipo: string;
  assunto: string | null;
  corpo: string;
  ativo: boolean;
  is_padrao: boolean;
};

export const MODELO_MENSAGEM_COLUMNS =
  'id, rede_id, canal, tipo, assunto, corpo, ativo, is_padrao, created_at, updated_at, deleted_at';

/** Linha do join usado pelo worker de lembretes (agendamentos + cadastros). */
export type AgendamentoLembreteModel = {
  id: string;
  rede_id: string;
  data_hora_inicio: string;
  status: string;
  paciente_id: string;
  profissional_id: string;
  unidade_id: string;
  unidades: {
    nome: string;
    telefone: string | null;
    timezone: string;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
  } | null;
  pacientes: { nome: string; telefone: string | null; email: string | null } | null;
  profissionais: { nome: string; especialidade: string | null } | null;
  redes: { nome: string } | null;
};

export const AGENDAMENTO_LEMBRETE_SELECT =
  'id, rede_id, data_hora_inicio, status, paciente_id, profissional_id, unidade_id, ' +
  'unidades (nome, telefone, timezone, cep, logradouro, numero, complemento, bairro, cidade, uf), ' +
  'pacientes (nome, telefone, email), ' +
  'profissionais (nome, especialidade), ' +
  'redes (nome)';
