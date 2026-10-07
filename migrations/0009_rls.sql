-- =============================================================================
-- 0009_rls.sql — Row Level Security: isolamento inviolável por rede (tenant)
-- =============================================================================
-- A aplicação executa `SELECT set_config('app.rede_id', $1, true)` no início de
-- cada transação (ver src/server/infrastructure/database). As políticas abaixo
-- garantem o isolamento também no banco, conforme agents/spec-v1.md §5.
--
-- IMPORTANTE: o dono das tabelas ignora RLS por padrão. Em produção, conecte a
-- aplicação com um papel dedicado e sem BYPASSRLS (ver bloco final do arquivo).
-- =============================================================================

CREATE OR REPLACE FUNCTION app_rede_atual()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.rede_id', TRUE), '')::uuid;
$$ LANGUAGE sql STABLE;

DO $$
DECLARE
  tabela TEXT;
  tabelas TEXT[] := ARRAY[
    'unidades',
    'usuarios',
    'usuario_unidades',
    'profissionais',
    'profissional_unidades',
    'horarios_atendimento',
    'pacientes',
    'importacoes_pacientes',
    'tipos_atendimento',
    'agendamentos',
    'bloqueios_agenda',
    'templates_prontuario',
    'atendimentos',
    'adendos',
    'anexos',
    'documentos',
    'notificacoes',
    'mensagens_whatsapp',
    'auditoria',
    'acessos_prontuario'
  ];
BEGIN
  FOREACH tabela IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (rede_id = app_rede_atual()) WITH CHECK (rede_id = app_rede_atual())',
      tabela || '_isolamento_rede',
      tabela
    );
  END LOOP;
END;
$$;

-- A própria tabela de redes só expõe a rede do contexto atual.
ALTER TABLE redes ENABLE ROW LEVEL SECURITY;
CREATE POLICY redes_isolamento_rede ON redes
  USING (id = app_rede_atual())
  WITH CHECK (id = app_rede_atual());

-- -----------------------------------------------------------------------------
-- Papel de aplicação (execute manualmente em produção, com um superusuário):
--
--   CREATE ROLE clinica_app LOGIN PASSWORD 'troque-esta-senha';
--   GRANT USAGE ON SCHEMA public TO clinica_app;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clinica_app;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public
--     GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clinica_app;
--
-- Em seguida aponte DATABASE_URL para esse papel. As migrations e o seed devem
-- continuar rodando com o papel dono das tabelas.
-- -----------------------------------------------------------------------------
