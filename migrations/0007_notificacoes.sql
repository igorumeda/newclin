-- =============================================================================
-- 0007_notificacoes.sql — Fila assíncrona e log de e-mail / WhatsApp
-- =============================================================================

CREATE TYPE notificacao_canal AS ENUM ('email', 'whatsapp');

CREATE TYPE notificacao_tipo AS ENUM (
  'confirmacao_agendamento',
  'lembrete_consulta',
  'cancelamento_agendamento',
  'documento_clinico'
);

CREATE TYPE notificacao_status AS ENUM (
  'pendente',
  'processando',
  'enviado',
  'falha',
  'cancelado'
);

CREATE TYPE mensagem_direcao AS ENUM ('entrada', 'saida');

-- Fila + log de envio. Uma linha por tentativa de comunicação.
CREATE TABLE notificacoes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id              UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  canal                notificacao_canal NOT NULL,
  tipo                 notificacao_tipo NOT NULL,
  destinatario         TEXT NOT NULL,
  assunto              TEXT,
  conteudo             TEXT NOT NULL,
  variaveis            JSONB NOT NULL DEFAULT '{}'::jsonb,
  status               notificacao_status NOT NULL DEFAULT 'pendente',
  tentativas           INTEGER NOT NULL DEFAULT 0,
  erro                 TEXT,
  agendada_para        TIMESTAMPTZ NOT NULL DEFAULT now(),
  enviada_em           TIMESTAMPTZ,
  agendamento_id       UUID REFERENCES agendamentos (id) ON DELETE SET NULL,
  paciente_id          UUID REFERENCES pacientes (id) ON DELETE SET NULL,
  documento_id         UUID REFERENCES documentos (id) ON DELETE SET NULL,
  provider             TEXT,
  provider_message_id  TEXT,
  fallback_de          UUID REFERENCES notificacoes (id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notificacoes_fila_idx ON notificacoes (status, agendada_para)
  WHERE status IN ('pendente', 'processando');
CREATE INDEX notificacoes_rede_idx ON notificacoes (rede_id, created_at DESC);
CREATE INDEX notificacoes_agendamento_idx ON notificacoes (rede_id, agendamento_id);
-- Evita lembretes duplicados para o mesmo agendamento/canal.
CREATE UNIQUE INDEX notificacoes_lembrete_unico
  ON notificacoes (agendamento_id, canal, tipo)
  WHERE tipo = 'lembrete_consulta' AND status <> 'falha';

CREATE TRIGGER notificacoes_updated_at
  BEFORE UPDATE ON notificacoes
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- Log completo das mensagens de WhatsApp (entrada e saída).
CREATE TABLE mensagens_whatsapp (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id              UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  direcao              mensagem_direcao NOT NULL,
  telefone             TEXT NOT NULL,
  conteudo             TEXT NOT NULL,
  provider             TEXT NOT NULL,
  provider_message_id  TEXT,
  agendamento_id       UUID REFERENCES agendamentos (id) ON DELETE SET NULL,
  paciente_id          UUID REFERENCES pacientes (id) ON DELETE SET NULL,
  payload              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mensagens_whatsapp_rede_idx ON mensagens_whatsapp (rede_id, created_at DESC);
CREATE INDEX mensagens_whatsapp_telefone_idx ON mensagens_whatsapp (telefone, created_at DESC);
