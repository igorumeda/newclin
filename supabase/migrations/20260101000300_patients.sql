-- =============================================================================
-- Clínica SaaS v1.0 — 03 · Pacientes
-- =============================================================================
-- Regras de negócio atendidas (§3.3 e §5):
--   - Paciente pertence à REDE (não à unidade) e é atendido em qualquer unidade.
--   - Campos obrigatórios: nome, CPF, data de nascimento, sexo.
--   - Responsável obrigatório para menores de 18 anos.
--   - Detecção de duplicidade por CPF e fallback por nome + data de nascimento.
--   - Soft delete (`inativo` + `deleted_at`): nunca exclusão física.
--   - LGPD: consentimento registrado com data e origem.
-- =============================================================================

create table if not exists public.pacientes (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  nome text not null,
  cpf text not null,
  data_nascimento date not null,
  sexo text not null,
  telefone text,
  email text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf char(2),
  responsavel_nome text,
  responsavel_cpf text,
  responsavel_telefone text,
  responsavel_parentesco text,
  alergias text,
  condicoes_cronicas text,
  observacoes text,
  consentimento_lgpd boolean not null default false,
  consentimento_lgpd_em timestamptz,
  consentimento_lgpd_origem text,
  importado_em timestamptz,
  ativo boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint pacientes_cpf_valido check (public.validar_cpf(cpf)),
  constraint pacientes_sexo_valido check (sexo in ('feminino', 'masculino', 'outro', 'nao_informado')),
  constraint pacientes_nascimento_valido check (data_nascimento <= current_date),
  constraint pacientes_email_formato check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint pacientes_responsavel_menor check (
    data_nascimento > (current_date - interval '18 years')
    or responsavel_nome is not null
    or consentimento_lgpd = true
  ),
  constraint pacientes_uf_formato check (uf is null or uf ~ '^[A-Z]{2}$')
);

comment on table public.pacientes is
  'Prontuário cadastral do paciente. Único por rede e compartilhado entre todas as unidades.';

-- Um CPF por rede (entre pacientes ativos).
create unique index if not exists pacientes_rede_cpf_uidx
  on public.pacientes (rede_id, cpf)
  where deleted_at is null;

-- Fallback de duplicidade: nome + data de nascimento.
create index if not exists pacientes_nome_nascimento_idx
  on public.pacientes (rede_id, public.f_unaccent(lower(nome)), data_nascimento)
  where deleted_at is null;

-- Busca parcial por nome (case/acento-insensível) e exata por CPF.
create index if not exists pacientes_nome_trgm_idx
  on public.pacientes using gin (public.f_unaccent(lower(nome)) extensions.gin_trgm_ops)
  where deleted_at is null;

create index if not exists pacientes_rede_ativo_idx on public.pacientes (rede_id, ativo) where deleted_at is null;

drop trigger if exists trg_pacientes_updated_at on public.pacientes;
create trigger trg_pacientes_updated_at before update on public.pacientes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Verificação de duplicidade (usada no cadastro, na edição e na importação CSV)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.verificar_paciente_duplicado(
  p_rede_id uuid,
  p_cpf text,
  p_nome text,
  p_data_nascimento date,
  p_ignorar_id uuid default null
)
returns table (
  id uuid,
  nome text,
  cpf text,
  data_nascimento date,
  ativo boolean,
  motivo text
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.nome,
    p.cpf,
    p.data_nascimento,
    p.ativo,
    case
      when p.cpf = regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g') then 'cpf'
      else 'nome_data_nascimento'
    end as motivo
  from public.pacientes p
  where p.rede_id = p_rede_id
    and p.deleted_at is null
    and (p_ignorar_id is null or p.id <> p_ignorar_id)
    and (
      p.cpf = regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')
      or (
        public.f_unaccent(lower(p.nome)) = public.f_unaccent(lower(btrim(coalesce(p_nome, ''))))
        and p.data_nascimento = p_data_nascimento
      )
    )
  order by (p.cpf = regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) desc
  limit 5;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Busca paginada de pacientes (nome parcial acento-insensível ou CPF exato)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.buscar_pacientes(
  p_termo text default null,
  p_unidade_id uuid default null,
  p_somente_ativos boolean default true,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  nome text,
  cpf text,
  data_nascimento date,
  sexo text,
  telefone text,
  email text,
  ativo boolean,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with filtro as (
    select
      nullif(btrim(coalesce(p_termo, '')), '') as termo,
      regexp_replace(coalesce(p_termo, ''), '\D', '', 'g') as termo_digitos
  )
  select
    p.id,
    p.nome,
    p.cpf,
    p.data_nascimento,
    p.sexo,
    p.telefone,
    p.email,
    p.ativo,
    p.created_at,
    count(*) over () as total_count
  from public.pacientes p
  cross join filtro f
  where p.deleted_at is null
    and p.rede_id = public.current_rede_id()
    and (not p_somente_ativos or p.ativo)
    and (p_unidade_id is null or public.has_unit_access(p_unidade_id))
    and (
      f.termo is null
      or (
        length(f.termo_digitos) = 11
        and p.cpf = f.termo_digitos
      )
      or public.f_unaccent(lower(p.nome)) like '%' || public.f_unaccent(lower(f.termo)) || '%'
    )
  order by p.nome asc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.verificar_paciente_duplicado(uuid, text, text, date, uuid) to authenticated, service_role;
grant execute on function public.buscar_pacientes(text, uuid, boolean, integer, integer) to authenticated, service_role;

