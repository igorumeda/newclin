-- =============================================================================
-- Clínica SaaS v1.0 — 08 · Auditoria
-- =============================================================================
-- Regras de negócio atendidas (§3.2 e §5):
--   - Toda ação sensível (acesso a prontuário, alteração de dados, exclusão)
--     é registrada com: quem, quando, o quê e de qual unidade.
--   - Log de acesso a prontuários (LGPD).
--   - Trilha imutável: nenhuma atualização/exclusão de registros de auditoria.
-- =============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  user_id uuid,
  user_nome text,
  user_email text,
  user_role text,
  unidade_id uuid references public.unidades (id) on delete set null,
  acao text not null,
  entidade text not null,
  registro_id text,
  descricao text,
  dados_antes jsonb,
  dados_depois jsonb,
  ip text,
  user_agent text,
  origem text not null default 'api',
  created_at timestamptz not null default timezone('utc', now()),
  constraint audit_logs_acao_valida check (
    acao in ('criar', 'atualizar', 'excluir', 'ler', 'login', 'logout', 'exportar', 'emitir', 'cancelar', 'processar')
  )
);

comment on table public.audit_logs is
  'Trilha de auditoria imutável. Cada linha registra quem fez o quê, quando, em qual unidade e com quais dados.';

create index if not exists audit_logs_rede_created_idx on public.audit_logs (rede_id, created_at desc);
create index if not exists audit_logs_entidade_idx on public.audit_logs (entidade, registro_id);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);
create index if not exists audit_logs_lgpd_prontuario_idx
  on public.audit_logs (rede_id, entidade, registro_id, created_at desc)
  where acao = 'ler';

-- ─────────────────────────────────────────────────────────────────────────────
-- Função de registro (usada pela API e por triggers)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.registrar_auditoria(
  p_acao text,
  p_entidade text,
  p_registro_id text default null,
  p_rede_id uuid default null,
  p_unidade_id uuid default null,
  p_descricao text default null,
  p_dados_antes jsonb default null,
  p_dados_depois jsonb default null,
  p_origem text default 'api'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_id uuid;
begin
  v_profile := public.current_profile();

  insert into public.audit_logs (
    rede_id, user_id, user_nome, user_email, user_role, unidade_id,
    acao, entidade, registro_id, descricao, dados_antes, dados_depois, origem
  )
  values (
    coalesce(p_rede_id, v_profile.rede_id),
    v_profile.id,
    v_profile.nome,
    v_profile.email,
    v_profile.role,
    p_unidade_id,
    p_acao,
    p_entidade,
    p_registro_id,
    p_descricao,
    p_dados_antes,
    p_dados_depois,
    p_origem
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.registrar_auditoria(text, text, text, uuid, uuid, text, jsonb, jsonb, text)
  to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger genérica de auditoria (dados antes/depois) para tabelas sensíveis
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.auditar_alteracao()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_acao text;
  v_antes jsonb;
  v_depois jsonb;
  v_registro_id text;
  v_rede_id uuid;
begin
  if tg_op = 'INSERT' then
    v_acao := 'criar';
    v_antes := null;
    v_depois := to_jsonb(new) - 'deleted_at';
    v_registro_id := new.id::text;
    v_rede_id := new.rede_id;
  elsif tg_op = 'UPDATE' then
    v_acao := 'atualizar';
    v_antes := to_jsonb(old) - 'deleted_at';
    v_depois := to_jsonb(new) - 'deleted_at';
    v_registro_id := new.id::text;
    v_rede_id := new.rede_id;
  else
    v_acao := 'excluir';
    v_antes := to_jsonb(old) - 'deleted_at';
    v_depois := null;
    v_registro_id := old.id::text;
    v_rede_id := old.rede_id;
  end if;

  perform public.registrar_auditoria(
    p_acao => v_acao,
    p_entidade => tg_table_name,
    p_registro_id => v_registro_id,
    p_rede_id => v_rede_id,
    p_dados_antes => v_antes,
    p_dados_depois => v_depois,
    p_origem => 'trigger'
  );

  return coalesce(new, old);
end;
$$;

-- Tabelas com trilha automática de antes/depois.
drop trigger if exists trg_audit_atendimentos on public.atendimentos;
create trigger trg_audit_atendimentos after insert or update or delete on public.atendimentos
  for each row execute function public.auditar_alteracao();

drop trigger if exists trg_audit_evolucoes on public.evolucoes;
create trigger trg_audit_evolucoes after insert or update or delete on public.evolucoes
  for each row execute function public.auditar_alteracao();

drop trigger if exists trg_audit_documentos on public.documentos;
create trigger trg_audit_documentos after insert or update or delete on public.documentos
  for each row execute function public.auditar_alteracao();

drop trigger if exists trg_audit_agendamentos on public.agendamentos;
create trigger trg_audit_agendamentos after update or delete on public.agendamentos
  for each row execute function public.auditar_alteracao();

drop trigger if exists trg_audit_anexos on public.anexos;
create trigger trg_audit_anexos after insert or delete on public.anexos
  for each row execute function public.auditar_alteracao();

drop trigger if exists trg_audit_pacientes on public.pacientes;
create trigger trg_audit_pacientes after insert or delete on public.pacientes
  for each row execute function public.auditar_alteracao();

-- ─────────────────────────────────────────────────────────────────────────────
-- Log de leitura de prontuário (LGPD) — chamado pelo backend a cada acesso.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.registrar_acesso_prontuario(
  p_paciente_id uuid,
  p_atendimento_id uuid default null,
  p_unidade_id uuid default null
)
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.registrar_auditoria(
    p_acao => 'ler',
    p_entidade => case when p_atendimento_id is null then 'pacientes' else 'atendimentos' end,
    p_registro_id => coalesce(p_atendimento_id, p_paciente_id)::text,
    p_rede_id => public.current_rede_id(),
    p_unidade_id => p_unidade_id,
    p_descricao => 'Acesso ao prontuário do paciente ' || p_paciente_id::text,
    p_origem => 'api'
  );
$$;

grant execute on function public.registrar_acesso_prontuario(uuid, uuid, uuid) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Imutabilidade da trilha de auditoria
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.proteger_auditoria()
returns trigger
language plpgsql
as $$
begin
  raise exception 'A trilha de auditoria é imutável.' using errcode = '23514';
end;
$$;

drop trigger if exists trg_audit_logs_imutavel on public.audit_logs;
create trigger trg_audit_logs_imutavel before update or delete on public.audit_logs
  for each row execute function public.proteger_auditoria();
