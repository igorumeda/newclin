-- =============================================================================
-- 0008_auditoria.sql — Auditoria geral e log de acesso a prontuários (LGPD)
-- =============================================================================

CREATE TYPE auditoria_acao AS ENUM (
  'criar',
  'atualizar',
  'excluir',
  'visualizar',
  'login',
  'logout',
  'exportar',
  'emitir'
);

CREATE TABLE auditoria (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id      UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  usuario_id   UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  usuario_nome TEXT,
  unidade_id   UUID REFERENCES unidades (id) ON DELETE SET NULL,
  acao         auditoria_acao NOT NULL,
  entidade     TEXT NOT NULL,
  entidade_id  TEXT,
  descricao    TEXT,
  dados_antes  JSONB,
  dados_depois JSONB,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX auditoria_rede_idx ON auditoria (rede_id, created_at DESC);
CREATE INDEX auditoria_entidade_idx ON auditoria (rede_id, entidade, entidade_id);
CREATE INDEX auditoria_usuario_idx ON auditoria (rede_id, usuario_id, created_at DESC);

-- Log específico de acesso ao conteúdo clínico (exigência de LGPD).
CREATE TABLE acessos_prontuario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id         UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  usuario_nome    TEXT,
  paciente_id     UUID NOT NULL REFERENCES pacientes (id) ON DELETE CASCADE,
  atendimento_id  UUID REFERENCES atendimentos (id) ON DELETE SET NULL,
  unidade_id      UUID REFERENCES unidades (id) ON DELETE SET NULL,
  ip              TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX acessos_prontuario_rede_idx ON acessos_prontuario (rede_id, created_at DESC);
CREATE INDEX acessos_prontuario_paciente_idx ON acessos_prontuario (rede_id, paciente_id, created_at DESC);
