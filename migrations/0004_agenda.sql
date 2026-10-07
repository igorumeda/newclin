-- =============================================================================
-- 0004_agenda.sql — Tipos de atendimento, agendamentos e bloqueios
-- =============================================================================

CREATE TYPE agendamento_status AS ENUM (
  'agendado',
  'confirmado',
  'aguardando',
  'em_atendimento',
  'finalizado',
  'cancelado',
  'faltou'
);

CREATE TYPE agendamento_origem AS ENUM ('recepcao', 'importacao', 'whatsapp', 'sistema');

CREATE TABLE tipos_atendimento (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id           UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  duracao_minutos   INTEGER NOT NULL DEFAULT 30 CHECK (duracao_minutos BETWEEN 5 AND 480),
  cor               TEXT NOT NULL DEFAULT '#0ea5e9',
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX tipos_atendimento_nome_unico
  ON tipos_atendimento (rede_id, app_sem_acento(nome)) WHERE deleted_at IS NULL;

CREATE TRIGGER tipos_atendimento_updated_at
  BEFORE UPDATE ON tipos_atendimento
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- ────────────────────────────── Agendamentos ────────────────────────────────

CREATE TABLE agendamentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id               UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  unidade_id            UUID NOT NULL REFERENCES unidades (id) ON DELETE RESTRICT,
  profissional_id       UUID NOT NULL REFERENCES profissionais (id) ON DELETE RESTRICT,
  paciente_id           UUID NOT NULL REFERENCES pacientes (id) ON DELETE RESTRICT,
  tipo_atendimento_id   UUID NOT NULL REFERENCES tipos_atendimento (id) ON DELETE RESTRICT,
  data_hora_inicio      TIMESTAMPTZ NOT NULL,
  data_hora_fim         TIMESTAMPTZ NOT NULL,
  status                agendamento_status NOT NULL DEFAULT 'agendado',
  encaixe               BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes           TEXT,
  motivo_cancelamento   TEXT,
  checkin_em            TIMESTAMPTZ,
  ordem_chegada         INTEGER,
  origem                agendamento_origem NOT NULL DEFAULT 'recepcao',
  criado_por            UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,
  CONSTRAINT agendamentos_intervalo_valido CHECK (data_hora_fim > data_hora_inicio)
);

CREATE INDEX agendamentos_agenda_idx
  ON agendamentos (rede_id, unidade_id, profissional_id, data_hora_inicio)
  WHERE deleted_at IS NULL;
CREATE INDEX agendamentos_paciente_idx ON agendamentos (rede_id, paciente_id, data_hora_inicio DESC);
CREATE INDEX agendamentos_dia_idx ON agendamentos (rede_id, data_hora_inicio);
CREATE INDEX agendamentos_status_idx ON agendamentos (rede_id, status);

CREATE TRIGGER agendamentos_updated_at
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();

-- ───────────────────────────── Bloqueios de agenda ──────────────────────────
-- profissional_id nulo = bloqueio de toda a unidade.

CREATE TABLE bloqueios_agenda (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rede_id           UUID NOT NULL REFERENCES redes (id) ON DELETE CASCADE,
  unidade_id        UUID NOT NULL REFERENCES unidades (id) ON DELETE CASCADE,
  profissional_id   UUID REFERENCES profissionais (id) ON DELETE CASCADE,
  motivo            TEXT NOT NULL,
  data_hora_inicio  TIMESTAMPTZ NOT NULL,
  data_hora_fim     TIMESTAMPTZ NOT NULL,
  criado_por        UUID REFERENCES usuarios (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT bloqueios_intervalo_valido CHECK (data_hora_fim > data_hora_inicio)
);

CREATE INDEX bloqueios_agenda_idx
  ON bloqueios_agenda (rede_id, unidade_id, profissional_id, data_hora_inicio)
  WHERE deleted_at IS NULL;

CREATE TRIGGER bloqueios_agenda_updated_at
  BEFORE UPDATE ON bloqueios_agenda
  FOR EACH ROW EXECUTE FUNCTION app_set_updated_at();
