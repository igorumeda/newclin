-- =============================================================================
-- Clínica SaaS v1.0 — 04 · Agenda
-- =============================================================================
-- Regras de negócio atendidas (§3.4):
--   - Tipos de atendimento por rede (duração padrão + cor).
--   - Agenda organizada por profissional + unidade + data.
--   - Fluxo de status com transições permitidas (validado no domínio e no banco).
--   - Conflito de horários: bloqueado, exceto em encaixe (que gera aviso visual).
--   - Check-in registrado para o painel de recepção (tempo de espera).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Tipos de atendimento
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.tipos_atendimento (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  nome text not null,
  descricao text,
  duracao_minutos integer not null default 30,
  cor text not null default '#0ea5e9',
  requer_confirmacao boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint tipos_atendimento_duracao_valida check (duracao_minutos between 5 and 480),
  constraint tipos_atendimento_cor_formato check (cor ~* '^#[0-9a-f]{6}$')
);

create unique index if not exists tipos_atendimento_rede_nome_uidx
  on public.tipos_atendimento (rede_id, lower(nome)) where deleted_at is null;

drop trigger if exists trg_tipos_atendimento_updated_at on public.tipos_atendimento;
create trigger trg_tipos_atendimento_updated_at before update on public.tipos_atendimento
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Agendamentos
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.agendamentos (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  profissional_id uuid not null references public.profissionais (id) on delete restrict,
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  tipo_atendimento_id uuid references public.tipos_atendimento (id) on delete set null,
  data_hora_inicio timestamptz not null,
  data_hora_fim timestamptz not null,
  status text not null default 'agendado',
  encaixe boolean not null default false,
  encaixe_justificativa text,
  observacoes text,
  check_in_em timestamptz,
  iniciado_em timestamptz,
  finalizado_em timestamptz,
  cancelado_em timestamptz,
  motivo_cancelamento text,
  confirmado_em timestamptz,
  confirmado_por text,
  criado_por uuid,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint agendamentos_periodo_valido check (data_hora_fim > data_hora_inicio),
  constraint agendamentos_status_valido check (
    status in ('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'finalizado', 'cancelado', 'faltou')
  ),
  constraint agendamentos_encaixe_justificado check (encaixe = false or encaixe_justificativa is not null),
  constraint agendamentos_confirmacao_origem check (
    confirmado_por is null or confirmado_por in ('paciente', 'recepcao', 'sistema')
  ),
  constraint agendamentos_cancelamento_motivo check (
    status <> 'cancelado' or motivo_cancelamento is not null
  )
);

comment on column public.agendamentos.encaixe is
  'Encaixe (sobrecarga) permitido apenas pela recepção; exibe aviso visual de conflito.';
comment on column public.agendamentos.check_in_em is
  'Momento do check-in na recepção — base para o cálculo do tempo de espera.';

-- Impede sobreposição de horários do mesmo profissional na mesma unidade.
-- Encaixes (encaixe = true) e agendamentos cancelados/faltas ficam fora da regra.
alter table public.agendamentos drop constraint if exists agendamentos_sem_conflito;
alter table public.agendamentos
  add constraint agendamentos_sem_conflito
  exclude using gist (
    profissional_id with =,
    unidade_id with =,
    tsrange(data_hora_inicio, data_hora_fim) with &&
  )
  where (encaixe = false and deleted_at is null and status <> 'cancelado' and status <> 'faltou');

create index if not exists agendamentos_agenda_idx
  on public.agendamentos (rede_id, unidade_id, profissional_id, data_hora_inicio)
  where deleted_at is null;

create index if not exists agendamentos_paciente_idx
  on public.agendamentos (rede_id, paciente_id, data_hora_inicio desc)
  where deleted_at is null;

create index if not exists agendamentos_recepcao_idx
  on public.agendamentos (rede_id, unidade_id, status, check_in_em)
  where deleted_at is null;

-- Um atendimento clínico por agendamento (garantido também na tabela atendimentos).
create index if not exists agendamentos_periodo_status_idx
  on public.agendamentos (rede_id, data_hora_inicio, status)
  where deleted_at is null;

drop trigger if exists trg_agendamentos_updated_at on public.agendamentos;
create trigger trg_agendamentos_updated_at before update on public.agendamentos
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Transições de status permitidas (§3.4)
--   agendado → confirmado → aguardando → em_atendimento → finalizado
--   cancelável a partir de: agendado, confirmado, aguardando, em_atendimento
--   agendado/confirmado/aguardando → faltou
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.transicao_status_valida(p_de text, p_para text)
returns boolean
language sql
immutable
as $$
  select case
    when p_de = p_para then true
    when p_de = 'agendado' and p_para in ('confirmado', 'aguardando', 'cancelado', 'faltou') then true
    when p_de = 'confirmado' and p_para in ('aguardando', 'em_atendimento', 'cancelado', 'faltou') then true
    when p_de = 'aguardando' and p_para in ('em_atendimento', 'cancelado', 'faltou') then true
    when p_de = 'em_atendimento' and p_para in ('finalizado', 'cancelado') then true
    else false
  end;
$$;

create or replace function public.validar_transicao_agendamento()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and not public.transicao_status_valida(old.status, new.status) then
    raise exception 'Transição de status inválida: % → %', old.status, new.status
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_agendamentos_transicao on public.agendamentos;
create trigger trg_agendamentos_transicao before update on public.agendamentos
  for each row execute function public.validar_transicao_agendamento();

-- ─────────────────────────────────────────────────────────────────────────────
-- Histórico de status (rastreabilidade da agenda)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.agendamento_status_historico (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  agendamento_id uuid not null references public.agendamentos (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  observacao text,
  alterado_por uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists agendamento_status_historico_idx
  on public.agendamento_status_historico (agendamento_id, created_at desc);

create or replace function public.registrar_status_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.agendamento_status_historico (rede_id, agendamento_id, status_novo, alterado_por)
    values (new.rede_id, new.id, new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.agendamento_status_historico (rede_id, agendamento_id, status_anterior, status_novo, alterado_por)
    values (new.rede_id, new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_agendamentos_status_historico on public.agendamentos;
create trigger trg_agendamentos_status_historico after insert or update on public.agendamentos
  for each row execute function public.registrar_status_agendamento();

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificação de conflito (usada antes de gravar e para o aviso de encaixe)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.verificar_conflito_agenda(
  p_profissional_id uuid,
  p_unidade_id uuid,
  p_inicio timestamptz,
  p_fim timestamptz,
  p_ignorar_agendamento_id uuid default null
)
returns table (
  agendamento_id uuid,
  paciente_id uuid,
  paciente_nome text,
  data_hora_inicio timestamptz,
  data_hora_fim timestamptz,
  status text,
  encaixe boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    a.id,
    a.paciente_id,
    p.nome,
    a.data_hora_inicio,
    a.data_hora_fim,
    a.status,
    a.encaixe
  from public.agendamentos a
  join public.pacientes p on p.id = a.paciente_id
  where a.rede_id = public.current_rede_id()
    and a.profissional_id = p_profissional_id
    and a.unidade_id = p_unidade_id
    and a.deleted_at is null
    and a.status not in ('cancelado', 'faltou')
    and (p_ignorar_agendamento_id is null or a.id <> p_ignorar_agendamento_id)
    and tsrange(a.data_hora_inicio, a.data_hora_fim) && tsrange(p_inicio, p_fim)
  order by a.data_hora_inicio;
$$;

-- Verifica se o horário está coberto por um bloqueio de agenda.
create or replace function public.verificar_bloqueio_agenda(
  p_profissional_id uuid,
  p_unidade_id uuid,
  p_inicio timestamptz,
  p_fim timestamptz
)
returns table (
  bloqueio_id uuid,
  tipo text,
  motivo text,
  inicio timestamptz,
  fim timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select b.id, b.tipo, b.motivo, b.inicio, b.fim
  from public.bloqueios_agenda b
  where b.rede_id = public.current_rede_id()
    and b.profissional_id = p_profissional_id
    and b.unidade_id = p_unidade_id
    and b.deleted_at is null
    and b.ativo
    and tsrange(b.inicio, b.fim) && tsrange(p_inicio, p_fim)
  order by b.inicio;
$$;

grant execute on function public.verificar_conflito_agenda(uuid, uuid, timestamptz, timestamptz, uuid) to authenticated, service_role;
grant execute on function public.verificar_bloqueio_agenda(uuid, uuid, timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.transicao_status_valida(text, text) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Dados padrão por rede: tipos de atendimento (§3.4)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.seed_tipos_atendimento_padrao(p_rede_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.tipos_atendimento (rede_id, nome, duracao_minutos, cor, descricao)
  values
    (p_rede_id, 'Consulta', 30, '#0ea5e9', 'Consulta médica padrão'),
    (p_rede_id, 'Retorno', 20, '#22c55e', 'Retorno do paciente para reavaliação'),
    (p_rede_id, 'Procedimento', 60, '#f97316', 'Procedimentos ambulatoriais'),
    (p_rede_id, 'Avaliação', 60, '#8b5cf6', 'Avaliação inicial ou multidisciplinar'),
    (p_rede_id, 'Urgência', 30, '#ef4444', 'Atendimento de urgência encaixado')
  on conflict do nothing;
$$;

create or replace function public.on_rede_created_seed_tipos()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.seed_tipos_atendimento_padrao(new.id);
  return new;
end;
$$;

drop trigger if exists trg_redes_seed_tipos_atendimento on public.redes;
create trigger trg_redes_seed_tipos_atendimento after insert on public.redes
  for each row execute function public.on_rede_created_seed_tipos();

grant execute on function public.seed_tipos_atendimento_padrao(uuid) to service_role;
