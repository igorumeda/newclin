-- =============================================================================
-- Clínica SaaS v1.0 — 09 · Row Level Security (isolamento multi-tenant)
-- =============================================================================
-- Regra inviolável (§5): toda query filtra por `rede_id`. A RLS garante o
-- isolamento no banco, além da validação na camada de aplicação.
--
-- Papéis (§3.2):
--   admin_rede      → acesso total às unidades, configurações e relatórios
--   gestor_unidade  → apenas as unidades atribuídas
--   profissional    → própria agenda e prontuários dos pacientes que atende
--   recepcao        → agenda e cadastro das suas unidades, SEM conteúdo clínico
-- =============================================================================

alter table public.redes enable row level security;
alter table public.unidades enable row level security;
alter table public.profissionais enable row level security;
alter table public.profissional_unidades enable row level security;
alter table public.horarios_atendimento enable row level security;
alter table public.bloqueios_agenda enable row level security;
alter table public.tipos_atendimento enable row level security;
alter table public.profiles enable row level security;
alter table public.pacientes enable row level security;
alter table public.agendamentos enable row level security;
alter table public.agendamento_status_historico enable row level security;
alter table public.templates_prontuario enable row level security;
alter table public.atendimentos enable row level security;
alter table public.evolucoes enable row level security;
alter table public.anexos enable row level security;
alter table public.documentos enable row level security;
alter table public.modelos_mensagem enable row level security;
alter table public.notificacoes enable row level security;
alter table public.audit_logs enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- Redes (tenant)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists redes_select on public.redes;
create policy redes_select on public.redes
  for select to authenticated
  using (id = public.current_rede_id());

drop policy if exists redes_update on public.redes;
create policy redes_update on public.redes
  for update to authenticated
  using (id = public.current_rede_id() and public.is_rede_admin())
  with check (id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Unidades
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists unidades_select on public.unidades;
create policy unidades_select on public.unidades
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists unidades_insert on public.unidades;
create policy unidades_insert on public.unidades
  for insert to authenticated
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

drop policy if exists unidades_update on public.unidades;
create policy unidades_update on public.unidades
  for update to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Profissionais
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists profissionais_select on public.profissionais;
create policy profissionais_select on public.profissionais
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists profissionais_insert on public.profissionais;
create policy profissionais_insert on public.profissionais
  for insert to authenticated
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

drop policy if exists profissionais_update on public.profissionais;
create policy profissionais_update on public.profissionais
  for update to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Vínculos profissional × unidade e horários
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists profissional_unidades_select on public.profissional_unidades;
create policy profissional_unidades_select on public.profissional_unidades
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists profissional_unidades_write on public.profissional_unidades;
create policy profissional_unidades_write on public.profissional_unidades
  for all to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

drop policy if exists horarios_atendimento_select on public.horarios_atendimento;
create policy horarios_atendimento_select on public.horarios_atendimento
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists horarios_atendimento_write on public.horarios_atendimento;
create policy horarios_atendimento_write on public.horarios_atendimento
  for all to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Bloqueios de agenda: admin/gestor nas suas unidades; profissional na própria
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists bloqueios_agenda_select on public.bloqueios_agenda;
create policy bloqueios_agenda_select on public.bloqueios_agenda
  for select to authenticated
  using (rede_id = public.current_rede_id() and public.has_unit_access(unidade_id));

drop policy if exists bloqueios_agenda_insert on public.bloqueios_agenda;
create policy bloqueios_agenda_insert on public.bloqueios_agenda
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao') and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists bloqueios_agenda_update on public.bloqueios_agenda;
create policy bloqueios_agenda_update on public.bloqueios_agenda
  for update to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() in ('admin_rede', 'gestor_unidade') and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  )
  with check (rede_id = public.current_rede_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Tipos de atendimento (configuração da rede: leitura ampla, escrita do admin)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists tipos_atendimento_select on public.tipos_atendimento;
create policy tipos_atendimento_select on public.tipos_atendimento
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists tipos_atendimento_write on public.tipos_atendimento;
create policy tipos_atendimento_write on public.tipos_atendimento
  for all to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles (usuários)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or (rede_id = public.current_rede_id() and public.current_user_role() in ('admin_rede', 'gestor_unidade'))
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid() or (rede_id = public.current_rede_id() and public.is_rede_admin()))
  with check (rede_id = public.current_rede_id());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Pacientes: leitura para todos os papéis da rede (cadastro é compartilhado).
-- Exclusão (soft delete) restrita a admin e gestor de unidade.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists pacientes_select on public.pacientes;
create policy pacientes_select on public.pacientes
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists pacientes_insert on public.pacientes;
create policy pacientes_insert on public.pacientes
  for insert to authenticated
  with check (rede_id = public.current_rede_id());

drop policy if exists pacientes_update on public.pacientes;
create policy pacientes_update on public.pacientes
  for update to authenticated
  using (rede_id = public.current_rede_id())
  with check (rede_id = public.current_rede_id());

drop policy if exists pacientes_delete on public.pacientes;
create policy pacientes_delete on public.pacientes
  for delete to authenticated
  using (
    rede_id = public.current_rede_id()
    and public.current_user_role() in ('admin_rede', 'gestor_unidade')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Agendamentos
--   admin_rede/gestor_unidade/recepcao → unidades às quais têm acesso
--   profissional                       → apenas a própria agenda
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists agendamentos_select on public.agendamentos;
create policy agendamentos_select on public.agendamentos
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao') and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists agendamentos_insert on public.agendamentos;
create policy agendamentos_insert on public.agendamentos
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao') and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists agendamentos_update on public.agendamentos;
create policy agendamentos_update on public.agendamentos
  for update to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao') and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  )
  with check (rede_id = public.current_rede_id());

drop policy if exists agendamentos_delete on public.agendamentos;
create policy agendamentos_delete on public.agendamentos
  for delete to authenticated
  using (
    rede_id = public.current_rede_id()
    and public.current_user_role() in ('admin_rede', 'gestor_unidade')
    and public.has_unit_access(unidade_id)
  );

drop policy if exists agendamento_status_historico_select on public.agendamento_status_historico;
create policy agendamento_status_historico_select on public.agendamento_status_historico
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and exists (
      select 1 from public.agendamentos a
      where a.id = agendamento_id
        and (
          (public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao') and public.has_unit_access(a.unidade_id))
          or (public.current_user_role() = 'profissional' and a.profissional_id = public.current_profissional_id())
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Templates de prontuário (leitura ampla; configuração é do Admin da Rede)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists templates_prontuario_select on public.templates_prontuario;
create policy templates_prontuario_select on public.templates_prontuario
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists templates_prontuario_write on public.templates_prontuario;
create policy templates_prontuario_write on public.templates_prontuario
  for all to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Prontuário: a recepção NÃO acessa conteúdo clínico (§3.2).
--   ler/atender: admin_rede, gestor_unidade (nas suas unidades) e profissional
--                (apenas atendimentos próprios)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists atendimentos_select on public.atendimentos;
create policy atendimentos_select on public.atendimentos
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() = 'admin_rede')
      or (public.current_user_role() = 'gestor_unidade' and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists atendimentos_insert on public.atendimentos;
create policy atendimentos_insert on public.atendimentos
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and (
      (public.current_user_role() = 'admin_rede' and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists atendimentos_update on public.atendimentos;
create policy atendimentos_update on public.atendimentos
  for update to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      public.current_user_role() = 'admin_rede'
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  )
  with check (rede_id = public.current_rede_id());

drop policy if exists evolucoes_select on public.evolucoes;
create policy evolucoes_select on public.evolucoes
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      public.current_user_role() = 'admin_rede'
      or (public.current_user_role() = 'gestor_unidade' and exists (
        select 1 from public.atendimentos a
        where a.id = atendimento_id and public.has_unit_access(a.unidade_id)
      ))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists evolucoes_insert on public.evolucoes;
create policy evolucoes_insert on public.evolucoes
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and (
      public.current_user_role() = 'admin_rede'
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  );

drop policy if exists anexos_select on public.anexos;
create policy anexos_select on public.anexos
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and public.current_user_role() in ('admin_rede', 'gestor_unidade', 'profissional')
  );

drop policy if exists anexos_insert on public.anexos;
create policy anexos_insert on public.anexos
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and public.current_user_role() in ('admin_rede', 'profissional')
  );

drop policy if exists anexos_update on public.anexos;
create policy anexos_update on public.anexos
  for update to authenticated
  using (rede_id = public.current_rede_id() and public.current_user_role() in ('admin_rede', 'profissional'))
  with check (rede_id = public.current_rede_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Documentos clínicos
--   Leitura: admin, gestor (unidades), profissional (próprios) e recepção
--            apenas para declaração de comparecimento (uso na recepção).
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists documentos_select on public.documentos;
create policy documentos_select on public.documentos
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      public.current_user_role() = 'admin_rede'
      or (public.current_user_role() = 'gestor_unidade' and public.has_unit_access(unidade_id))
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
      or (
        public.current_user_role() = 'recepcao'
        and tipo = 'declaracao_comparecimento'
        and public.has_unit_access(unidade_id)
      )
    )
  );

drop policy if exists documentos_insert on public.documentos;
create policy documentos_insert on public.documentos
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and (
      public.current_user_role() = 'admin_rede'
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
      or (public.current_user_role() = 'recepcao' and tipo = 'declaracao_comparecimento' and public.has_unit_access(unidade_id))
    )
  );

drop policy if exists documentos_update on public.documentos;
create policy documentos_update on public.documentos
  for update to authenticated
  using (
    rede_id = public.current_rede_id()
    and (
      public.current_user_role() = 'admin_rede'
      or (public.current_user_role() = 'profissional' and profissional_id = public.current_profissional_id())
    )
  )
  with check (rede_id = public.current_rede_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Notificações e modelos de mensagem
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists notificacoes_select on public.notificacoes;
create policy notificacoes_select on public.notificacoes
  for select to authenticated
  using (
    rede_id = public.current_rede_id()
    and public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao')
  );

drop policy if exists notificacoes_insert on public.notificacoes;
create policy notificacoes_insert on public.notificacoes
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    and public.current_user_role() in ('admin_rede', 'gestor_unidade', 'recepcao')
  );

drop policy if exists notificacoes_update on public.notificacoes;
create policy notificacoes_update on public.notificacoes
  for update to authenticated
  using (rede_id = public.current_rede_id() and public.current_user_role() = 'admin_rede')
  with check (rede_id = public.current_rede_id());

drop policy if exists modelos_mensagem_select on public.modelos_mensagem;
create policy modelos_mensagem_select on public.modelos_mensagem
  for select to authenticated
  using (rede_id = public.current_rede_id());

drop policy if exists modelos_mensagem_write on public.modelos_mensagem;
create policy modelos_mensagem_write on public.modelos_mensagem
  for all to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin())
  with check (rede_id = public.current_rede_id() and public.is_rede_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Auditoria: leitura restrita ao Admin da Rede; inserção pela trilha.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (rede_id = public.current_rede_id() and public.is_rede_admin());

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (rede_id = public.current_rede_id());
