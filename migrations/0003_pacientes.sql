-- =============================================================================
-- 0003_pacientes.sql — Pacientes (pertencem à rede, não à unidade)
-- =============================================================================

CREATE TYPE paciente_sexo AS ENUM ('feminino', 'masculino', 'outro', 'nao_informado');

CREATE TABLE pacientes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id                UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  nome                   TEXT NOT NULL,
  cpf                    TEXT NOT NULL,
  data_nascimento        DATE NOT NULL,
  sexo                   paciente_sexo NOT NULL DEFAULT 'nao_informado',
  telefone               TEXT,
  email                  TEXT,
  endereco               JSONB NOT NULL DEFAULT '{}'::jsonb,
  responsavel_nome       TEXT,
  responsavel_telefone   TEXT,
  alergias               TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  condicoes_cronicas     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  observacoes            TEXT,
  consentimento_lgpd     BOOLEAN NOT NULL DEFAULT FALSE,
  consentimento_em       TIMESTAMPTZ,
  ativo                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at             TIMESTAMPTZ
);

-- Detecção de duplicidade primária: CPF único por rede.
CREATE UNIQUE INDEX pacientes_cpf_unico ON pacientes (rede_id, cpf) WHERE deleted_at IS NULL;
-- Fallback de duplicidade: nome normalizado + data de nascimento.
CREATE INDEX pacientes_nome_nascimento_idx
  ON pacientes (rede_id, app_sem_acento(nome), data_nascimento) WHERE deleted_at IS NULL;
CREATE INDEX pacientes_nome_busca ON pacientes (rede_id, app_sem_acento(nome));

CREATE TRIGGER pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- Relatório de cada importação de planilha (CSV/Excel).
CREATE TABLE importacoes_pacientes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id           UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  usuario_id        UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  arquivo_nome      TEXT NOT NULL,
  total_linhas      INTEGER NOT NULL DEFAULT 0,
  total_importados  INTEGER NOT NULL DEFAULT 0,
  total_ignorados   INTEGER NOT NULL DEFAULT 0,
  total_erros       INTEGER NOT NULL DEFAULT 0,
  detalhes          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX importacoes_pacientes_rede_idx ON importacoes_pacientes (rede_id, created_at DESC);
