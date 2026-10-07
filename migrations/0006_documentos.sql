-- =============================================================================
-- 0006_documentos.sql — Documentos clínicos emitidos em PDF
-- =============================================================================

CREATE TYPE documento_tipo AS ENUM (
  'receita',
  'atestado',
  'solicitacao_exames',
  'declaracao_comparecimento'
);

CREATE TYPE documento_status AS ENUM ('rascunho', 'emitido');

CREATE TABLE documentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id          UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  unidade_id       UUID NOT NULL REFERENCES unidades (id) ON DELETE RESTRICT,
  paciente_id      UUID NOT NULL REFERENCES pacientes (id) ON DELETE RESTRICT,
  atendimento_id   UUID REFERENCES atendimentos (id) ON DELETE SET NULL,
  profissional_id  UUID NOT NULL REFERENCES profissionais (id) ON DELETE RESTRICT,
  tipo             documento_tipo NOT NULL,
  conteudo         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status           documento_status NOT NULL DEFAULT 'rascunho',
  storage_key      TEXT,
  pdf_url          TEXT,
  emitido_em       TIMESTAMPTZ,
  emitido_por      UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX documentos_paciente_idx ON documentos (rede_id, paciente_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX documentos_atendimento_idx ON documentos (rede_id, atendimento_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();
