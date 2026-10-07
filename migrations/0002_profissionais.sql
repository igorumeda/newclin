-- =============================================================================
-- 0002_profissionais.sql — Profissionais, atuação por unidade e horários
-- =============================================================================

CREATE TYPE conselho_classe AS ENUM (
  'CRM',
  'CRO',
  'CRP',
  'CREFITO',
  'COREN',
  'CRN',
  'CRFa',
  'OUTRO'
);

CREATE TABLE profissionais (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id          UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  cpf              TEXT,
  email            TEXT,
  telefone         TEXT,
  conselho_classe  conselho_classe NOT NULL DEFAULT 'CRM',
  numero_conselho  TEXT NOT NULL,
  uf_conselho      TEXT,
  especialidade    TEXT NOT NULL,
  cor_agenda       TEXT NOT NULL DEFAULT '#0ea5e9',
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX profissionais_rede_idx ON profissionais (rede_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX profissionais_conselho_unico
  ON profissionais (rede_id, conselho_classe, numero_conselho)
  WHERE deleted_at IS NULL;
CREATE INDEX profissionais_nome_busca ON profissionais (rede_id, app_sem_acento(nome));

CREATE TRIGGER profissionais_updated_at
  BEFORE UPDATE ON profissionais
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_profissional_fk
  FOREIGN KEY (profissional_id) REFERENCES profissionais (id) ON DELETE SET NULL;

-- Um profissional pertence à rede e atua em uma ou mais unidades.
CREATE TABLE profissional_unidades (
  profissional_id  UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  unidade_id       UUID NOT NULL REFERENCES unidades (id) ON DELETE CASCADE,
  rede_id          UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profissional_id, unidade_id)
);

CREATE INDEX profissional_unidades_rede_idx ON profissional_unidades (rede_id);
CREATE INDEX profissional_unidades_unidade_idx ON profissional_unidades (unidade_id);

-- Horário de atendimento configurado por profissional + unidade + dia da semana.
CREATE TABLE horarios_atendimento (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id          UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  profissional_id  UUID NOT NULL REFERENCES profissionais (id) ON DELETE CASCADE,
  unidade_id       UUID NOT NULL REFERENCES unidades (id) ON DELETE CASCADE,
  dia_semana       SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio      TIME NOT NULL,
  hora_fim         TIME NOT NULL,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT horarios_intervalo_valido CHECK (hora_fim > hora_inicio)
);

CREATE INDEX horarios_profissional_idx
  ON horarios_atendimento (rede_id, profissional_id, unidade_id, dia_semana);

CREATE TRIGGER horarios_atendimento_updated_at
  BEFORE UPDATE ON horarios_atendimento
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();
