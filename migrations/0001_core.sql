-- =============================================================================
-- 0001_core.sql — Núcleo multi-tenant: redes, unidades, usuários e acessos
-- =============================================================================
-- Convenções (ver agents/spec-v1.md §5):
--   * Toda tabela de negócio possui rede_id, created_at e updated_at.
--   * Exclusão é lógica (deleted_at / ativo). Nada é removido fisicamente.
--   * Datas são armazenadas em UTC (timestamptz).
-- =============================================================================

-- ─────────────────────────── Funções utilitárias ────────────────────────────

CREATE OR REPLACE FUNCTION app_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Normalização de texto para buscas case/acento-insensitive (sem extensões).
CREATE OR REPLACE FUNCTION app_sem_acento(texto TEXT)
RETURNS TEXT AS $$
  SELECT lower(
    translate(
      COALESCE(texto, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
    )
  );
$$ LANGUAGE sql IMMUTABLE;

-- ──────────────────────────────── Enumerações ───────────────────────────────

CREATE TYPE usuario_role AS ENUM (
  'admin_rede',
  'gestor_unidade',
  'profissional',
  'recepcao'
);

-- ───────────────────────────────── Redes ────────────────────────────────────

CREATE TABLE redes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  cnpj          TEXT,
  logotipo_url  TEXT,
  tema          JSONB NOT NULL DEFAULT '{}'::jsonb,
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX redes_slug_unico ON redes (slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX redes_cnpj_unico ON redes (cnpj) WHERE cnpj IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER redes_updated_at
  BEFORE UPDATE ON redes
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- ──────────────────────────────── Unidades ──────────────────────────────────

CREATE TABLE unidades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id       UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  codigo        TEXT,
  telefone      TEXT,
  email         TEXT,
  endereco      JSONB NOT NULL DEFAULT '{}'::jsonb,
  fuso_horario  TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX unidades_rede_idx ON unidades (rede_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX unidades_codigo_unico ON unidades (rede_id, codigo)
  WHERE codigo IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER unidades_updated_at
  BEFORE UPDATE ON unidades
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- ──────────────────────────────── Usuários ──────────────────────────────────

CREATE TABLE usuarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id           UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  email             TEXT NOT NULL,
  senha_hash        TEXT NOT NULL,
  role              usuario_role NOT NULL,
  profissional_id   UUID,
  telefone          TEXT,
  avatar_url        TEXT,
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso_em  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (app_sem_acento(email))
  WHERE deleted_at IS NULL;
CREATE INDEX usuarios_rede_idx ON usuarios (rede_id) WHERE deleted_at IS NULL;

CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- Unidades às quais o usuário tem acesso (campo `unidades_acesso` da spec).
CREATE TABLE usuario_unidades (
  usuario_id  UUID NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  unidade_id  UUID NOT NULL REFERENCES unidades (id) ON DELETE CASCADE,
  rede_id     UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, unidade_id)
);

CREATE INDEX usuario_unidades_rede_idx ON usuario_unidades (rede_id);
CREATE INDEX usuario_unidades_unidade_idx ON usuario_unidades (unidade_id);
