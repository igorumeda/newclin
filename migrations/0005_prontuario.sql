-- =============================================================================
-- 0005_prontuario.sql — Templates, atendimentos, adendos e anexos
-- =============================================================================

CREATE TYPE atendimento_status AS ENUM ('em_andamento', 'finalizado', 'cancelado');
CREATE TYPE fonte_pagadora AS ENUM ('publico', 'particular', 'convenio');

-- ───────────────────────── Templates de prontuário ──────────────────────────
-- `estrutura` segue o contrato do motor de templates dinâmicos:
-- { "secoes": [ { "id", "titulo", "ordem",
--     "campos": [ { "id", "rotulo", "tipo", "obrigatorio", "valorPadrao", "opcoes" } ] } ] }

CREATE TABLE templates_prontuario (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id        UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  especialidade  TEXT NOT NULL,
  descricao      TEXT,
  versao         INTEGER NOT NULL DEFAULT 1,
  estrutura      JSONB NOT NULL DEFAULT '{"secoes":[]}'::jsonb,
  padrao         BOOLEAN NOT NULL DEFAULT FALSE,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX templates_prontuario_rede_idx ON templates_prontuario (rede_id)
  WHERE deleted_at IS NULL;
CREATE INDEX templates_prontuario_especialidade_idx
  ON templates_prontuario (rede_id, app_sem_acento(especialidade));

CREATE TRIGGER templates_prontuario_updated_at
  BEFORE UPDATE ON templates_prontuario
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- ──────────────────────────────── Atendimentos ──────────────────────────────

CREATE TABLE atendimentos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id                UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  unidade_id             UUID NOT NULL REFERENCES unidades (id) ON DELETE RESTRICT,
  agendamento_id         UUID REFERENCES agendamentos (id) ON DELETE SET NULL,
  paciente_id            UUID NOT NULL REFERENCES pacientes (id) ON DELETE RESTRICT,
  profissional_id        UUID NOT NULL REFERENCES profissionais (id) ON DELETE RESTRICT,
  template_id            UUID REFERENCES templates_prontuario (id) ON DELETE SET NULL,
  template_versao        INTEGER,
  dados_preenchidos      JSONB NOT NULL DEFAULT '{}'::jsonb,
  queixa_principal       TEXT,
  anamnese               TEXT,
  exame_fisico           TEXT,
  hipotese_diagnostica   TEXT,
  cid10                  TEXT,
  conduta                TEXT,
  fonte_pagadora         fonte_pagadora NOT NULL DEFAULT 'publico',
  status                 atendimento_status NOT NULL DEFAULT 'em_andamento',
  iniciado_em            TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em          TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at             TIMESTAMPTZ
);

CREATE UNIQUE INDEX atendimentos_agendamento_unico ON atendimentos (agendamento_id)
  WHERE agendamento_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX atendimentos_paciente_idx ON atendimentos (rede_id, paciente_id, iniciado_em DESC);
CREATE INDEX atendimentos_profissional_idx
  ON atendimentos (rede_id, profissional_id, iniciado_em DESC);
CREATE INDEX atendimentos_unidade_periodo_idx ON atendimentos (rede_id, unidade_id, iniciado_em);

CREATE TRIGGER atendimentos_updated_at
  BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- ─────────────────────────────────── Adendos ────────────────────────────────
-- Imutabilidade: após finalizado, correções ocorrem somente via adendo.

CREATE TABLE adendos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id          UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  atendimento_id   UUID NOT NULL REFERENCES atendimentos (id) ON DELETE CASCADE,
  profissional_id  UUID NOT NULL REFERENCES profissionais (id) ON DELETE RESTRICT,
  usuario_id       UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  conteudo         TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX adendos_atendimento_idx ON adendos (rede_id, atendimento_id, created_at);

-- ──────────────────────────────────── Anexos ────────────────────────────────

CREATE TABLE anexos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id         UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  paciente_id     UUID NOT NULL REFERENCES pacientes (id) ON DELETE CASCADE,
  atendimento_id  UUID REFERENCES atendimentos (id) ON DELETE SET NULL,
  nome_arquivo    TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  tamanho_bytes   BIGINT NOT NULL CHECK (tamanho_bytes > 0),
  storage_key     TEXT NOT NULL,
  descricao       TEXT,
  enviado_por     UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX anexos_paciente_idx ON anexos (rede_id, paciente_id) WHERE deleted_at IS NULL;
CREATE INDEX anexos_atendimento_idx ON anexos (rede_id, atendimento_id) WHERE deleted_at IS NULL;
