-- =============================================================================
-- Clínica SaaS v1.0 — 02 · Usuários, papéis e permissões
-- =============================================================================
-- Regras de negócio atendidas (§3.2):
--   - Todo usuário pertence a uma única rede.
--   - Papéis: admin_rede, gestor_unidade, profissional, recepcao.
--   - Usuário pode ter acesso a múltiplas unidades (`unidades_acesso`).
--   - Profissionais de saúde possuem vínculo com o cadastro de profissional.
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  -- Identidade de autenticação (Supabase Auth) separada da identidade de domínio.
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  rede_id uuid not null references public.redes (id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'recepcao',
  telefone text,
  avatar_url text,
  unidades_acesso uuid[] not null default '{}'::uuid[],
  profissional_id uuid references public.profissionais (id) on delete set null,
  ativo boolean not null default true,
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint profiles_role_valido check (role in ('admin_rede', 'gestor_unidade', 'profissional', 'recepcao')),
  constraint profiles_email_formato check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index if not exists profiles_auth_user_idx on public.profiles (auth_user_id);
create index if not exists profiles_rede_id_idx on public.profiles (rede_id) where deleted_at is null;
create index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers de autorização (SECURITY DEFINER para atravessar a RLS de profiles
-- sem recursão). Usados pelas policies de todas as tabelas de negócio.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.*
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.ativo
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.current_rede_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.rede_id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.ativo
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.ativo
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.current_profissional_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.profissional_id
  from public.profiles p
  where p.auth_user_id = auth.uid()
    and p.ativo
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.is_rede_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_user_role() = 'admin_rede', false);
$$;

-- O usuário tem acesso à unidade informada?
-- admin_rede: todas as unidades da rede. Demais papéis: apenas unidades atribuídas.
-- Profissional: acesso às unidades em que atua (profissional_unidades).
create or replace function public.has_unit_access(p_unidade_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.ativo
      and p.deleted_at is null
      and (
        p.role = 'admin_rede'
        or p_unidade_id = any (p.unidades_acesso)
        or (
          p.role = 'profissional'
          and exists (
            select 1
            from public.profissional_unidades pu
            where pu.profissional_id = p.profissional_id
              and pu.unidade_id = p_unidade_id
              and pu.ativo
              and pu.deleted_at is null
          )
        )
      )
  );
$$;

-- O usuário tem acesso a algum conjunto de unidades? (usado em listagens)
create or replace function public.has_any_unit_access(p_unidades uuid[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_rede_admin() or exists (
    select 1 from unnest(p_unidades) as u where public.has_unit_access(u)
  );
$$;

grant execute on function public.current_profile() to authenticated, service_role;
grant execute on function public.current_rede_id() to authenticated, service_role;
grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.current_profissional_id() to authenticated, service_role;
grant execute on function public.is_rede_admin() to authenticated, service_role;
grant execute on function public.has_unit_access(uuid) to authenticated, service_role;
grant execute on function public.has_any_unit_access(uuid[]) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: ao criar um usuário no Supabase Auth, cria o profile correspondente.
-- Os dados de rede/papel/unidades chegam em `raw_user_meta_data` (convite do Admin).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rede_id uuid;
  v_role text;
  v_nome text;
  v_unidades uuid[];
  v_profissional_id uuid;
begin
  v_rede_id := nullif(new.raw_user_meta_data ->> 'rede_id', '')::uuid;
  v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'recepcao');
  v_nome := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    split_part(coalesce(new.email, 'usuário'), '@', 1)
  );
  v_profissional_id := nullif(new.raw_user_meta_data ->> 'profissional_id', '')::uuid;

  begin
    v_unidades := coalesce(
      array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'unidades_acesso'))::uuid[],
      '{}'::uuid[]
    );
  exception when others then
    v_unidades := '{}'::uuid[];
  end;

  -- Sem rede informada: usuário fica pendente de vinculação (profile não é criado).
  if v_rede_id is null then
    return new;
  end if;

  insert into public.profiles (auth_user_id, rede_id, nome, email, role, unidades_acesso, profissional_id)
  values (new.id, v_rede_id, v_nome, coalesce(new.email, ''), v_role, v_unidades, v_profissional_id)
  on conflict (auth_user_id) do update
    set rede_id = excluded.rede_id,
        nome = excluded.nome,
        email = excluded.email,
        role = excluded.role,
        unidades_acesso = excluded.unidades_acesso,
        profissional_id = excluded.profissional_id,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Registro do último acesso (usado pelo layout e por auditoria)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.registrar_acesso()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.profiles
     set ultimo_acesso_em = timezone('utc', now())
   where auth_user_id = auth.uid();
$$;

grant execute on function public.registrar_acesso() to authenticated;
