-- =============================================================================
-- Clínica SaaS v1.0 — 01 · Organização (Multi-tenancy): Rede → Unidades → Profissionais
-- =============================================================================
-- Regras de negócio atendidas:
--   §3.1 hierarquia Rede → Unidades → Profissionais
--   §3.4 horários de atendimento por profissional + unidade e bloqueios de agenda
--   §3.7 tema de cores e logotipo por rede
--   §5   todas as tabelas de negócio possuem created_at, updated_at e rede_id
--        (ou herdam o isolamento por uma entidade pai com rede_id)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Redes (tenants)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.redes (
  id uuid primary key default extensions.gen_random_uuid(),
  nome text not null,
  razao_social text,
  cnpj text unique,
  slug text unique,
  email text,
  telefone text,
  tema jsonb not null default jsonb_build_object(
    'preset', 'azul-saude',
    'light', jsonb_build_object(
      'primary', '199 89% 48%',
      'primaryForeground', '210 40% 98%',
      'secondary', '210 40% 96.1%',
      'secondaryForeground', '222.2 47.4% 11.2%',
      'accent', '199 89% 95%',
      'accentForeground', '222.2 47.4% 11.2%',
      'background', '0 0% 100%',
      'foreground', '222.2 84% 4.9%',
      'border', '214.3 31.8% 91.4%',
      'sidebar', '222.2 84% 4.9%',
      'sidebarForeground', '210 40% 98%'
    ),
    'dark', jsonb_build_object(
      'primary', '199 89% 55%',
      'primaryForeground', '222.2 47.4% 11.2%',
      'secondary', '217.2 32.6% 17.5%',
      'secondaryForeground', '210 40% 98%',
      'accent', '217.2 32.6% 17.5%',
      'accentForeground', '210 40% 98%',
      'background', '222.2 84% 4.9%',
      'foreground', '210 40% 98%',
      'border', '217.2 32.6% 17.5%',
      'sidebar', '224 71% 4%',
      'sidebarForeground', '210 40% 98%'
    )
  ),
  logotipo_url text,
  logotipo_path text,
  config jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint redes_cnpj_formato check (cnpj is null or cnpj ~ '^\d{14}$'),
  constraint redes_email_formato check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.redes is 'Tenant do SaaS. Toda informação do sistema é isolada por rede.';
comment on column public.redes.tema is 'Tema visual da rede (§3.7): apenas cores — presets + customização livre.';
comment on column public.redes.config is 'Configurações operacionais da rede (agenda, notificações, LGPD).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Unidades (filiais / postos de atendimento)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.unidades (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  nome text not null,
  cnes text,
  cnpj text,
  telefone text,
  email text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf char(2),
  timezone text not null default 'America/Sao_Paulo',
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint unidades_uf_formato check (uf is null or uf ~ '^[A-Z]{2}$')
);

create index if not exists unidades_rede_id_idx on public.unidades (rede_id) where deleted_at is null;
create unique index if not exists unidades_rede_nome_uidx on public.unidades (rede_id, lower(nome)) where deleted_at is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Profissionais de saúde
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profissionais (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  nome text not null,
  cpf text,
  conselho_classe text not null,
  numero_conselho text not null,
  uf_conselho char(2),
  especialidade text,
  registro_especialista text,
  telefone text,
  email text,
  cor_agenda text not null default '#0ea5e9',
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint profissionais_cpf_valido check (public.validar_cpf(cpf)),
  constraint profissionais_conselho_uf_formato check (uf_conselho is null or uf_conselho ~ '^[A-Z]{2}$'),
  constraint profissionais_cor_agenda_formato check (cor_agenda ~* '^#[0-9a-f]{6}$')
);

create index if not exists profissionais_rede_id_idx on public.profissionais (rede_id) where deleted_at is null;
create index if not exists profissionais_especialidade_idx on public.profissionais (rede_id, lower(especialidade));
create unique index if not exists profissionais_registro_uidx
  on public.profissionais (rede_id, upper(conselho_classe), upper(numero_conselho), coalesce(uf_conselho, ''))
  where deleted_at is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Unidades de atuação do profissional (N:N)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profissional_unidades (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete cascade,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (profissional_id, unidade_id)
);

create index if not exists profissional_unidades_unidade_idx on public.profissional_unidades (unidade_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Horários de atendimento (por profissional + unidade + dia da semana)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.horarios_atendimento (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete cascade,
  dia_semana smallint not null,
  hora_inicio time not null,
  hora_fim time not null,
  duracao_slot_minutos integer not null default 30,
  intervalo_minutos integer not null default 0,
  vigencia_inicio date,
  vigencia_fim date,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint horarios_dia_semana_valido check (dia_semana between 0 and 6),
  constraint horarios_intervalo_valido check (hora_fim > hora_inicio),
  constraint horarios_duracao_valida check (duracao_slot_minutos between 5 and 480),
  constraint horarios_intervalo_entre_slots_valido check (intervalo_minutos between 0 and 120)
);

create index if not exists horarios_atendimento_busca_idx
  on public.horarios_atendimento (rede_id, profissional_id, unidade_id, dia_semana)
  where deleted_at is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Bloqueios de agenda (férias, congresso, almoço, manutenção)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.bloqueios_agenda (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete cascade,
  tipo text not null default 'outro',
  motivo text,
  inicio timestamptz not null,
  fim timestamptz not null,
  dia_inteiro boolean not null default false,
  criado_por uuid,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint bloqueios_tipo_valido check (tipo in ('ferias', 'congresso', 'almoco', 'manutencao', 'outro')),
  constraint bloqueios_periodo_valido check (fim > inicio)
);

create index if not exists bloqueios_agenda_busca_idx
  on public.bloqueios_agenda using gist (tsrange(inicio, fim))
  where deleted_at is null and ativo;

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers de updated_at
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists trg_redes_updated_at on public.redes;
create trigger trg_redes_updated_at before update on public.redes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_unidades_updated_at on public.unidades;
create trigger trg_unidades_updated_at before update on public.unidades
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profissionais_updated_at on public.profissionais;
create trigger trg_profissionais_updated_at before update on public.profissionais
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profissional_unidades_updated_at on public.profissional_unidades;
create trigger trg_profissional_unidades_updated_at before update on public.profissional_unidades
  for each row execute function public.set_updated_at();

drop trigger if exists trg_horarios_atendimento_updated_at on public.horarios_atendimento;
create trigger trg_horarios_atendimento_updated_at before update on public.horarios_atendimento
  for each row execute function public.set_updated_at();

drop trigger if exists trg_bloqueios_agenda_updated_at on public.bloqueios_agenda;
create trigger trg_bloqueios_agenda_updated_at before update on public.bloqueios_agenda
  for each row execute function public.set_updated_at();
