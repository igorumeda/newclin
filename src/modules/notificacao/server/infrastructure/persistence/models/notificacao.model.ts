import type { VariaveisNotificacao } from '../../../../domain/entities/notificacao.entity';

export type NotificacaoModel = {
  id: string;
  rede_id: string;
  canal: string;
  tipo: string;
  destinatario: string;
  assunto: string | null;
  conteudo: string;
  variaveis: VariaveisNotificacao;
  status: string;
  tentativas: number;
  erro: string | null;
  agendada_para: Date;
  enviada_em: Date | null;
  agendamento_id: string | null;
  paciente_id: string | null;
  documento_id: string | null;
  provider: string | null;
  provider_message_id: string | null;
  fallback_de: string | null;
  created_at: Date;
  updated_at: Date;
};

export type NotificacaoModelData = {
  id: string;
  rede_id: string;
  canal: string;
  tipo: string;
  destinatario: string;
  assunto: string | null;
  conteudo: string;
  variaveis: string;
  status: string;
  tentativas: number;
  erro: string | null;
  agendada_para: Date;
  enviada_em: Date | null;
  agendamento_id: string | null;
  paciente_id: string | null;
  documento_id: string | null;
  provider: string | null;
  provider_message_id: string | null;
  fallback_de: string | null;
};
