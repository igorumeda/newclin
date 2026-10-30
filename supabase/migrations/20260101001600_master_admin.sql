-- =============================================================================
-- Clínica SaaS v1.0 — 16 · Acesso Administrador Master (Multi-Rede Global)
-- =============================================================================
-- Regra de negócio:
--   - Usuários na tabela `public.profiles` com `rede_id IS NULL` são
--     Administradores Master da plataforma (não restritos a uma rede).
--   - Visualizam estatísticas e resumos gerais de todas as redes e gerenciam
--     outros usuários Masters.
-- =============================================================================

-- 1) Permitir `rede_id` nulo em `profiles` e `audit_logs`
alter table public.profiles
  alter column rede_id drop not null;

alter table public.profiles
  drop constraint if exists profiles_role_valido;

alter table public.profiles
  add constraint profiles_role_valido check (
    role in ('admin_master', 'admin_rede', 'gestor_unidade', 'profissional', 'recepcao')
  );

create index if not exists profiles_master_idx
  on public.profiles (created_at desc)
  where rede_id is null and deleted_at is null;

alter table public.audit_logs
  alter column rede_id drop not null;

-- 2) Helper de autorização Master (SECURITY DEFINER para atravessar RLS sem recursão)
create or replace function public.is_master_admin()
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
      and p.rede_id is null
      and p.ativo
      and p.deleted_at is null
  );
$$;

grant execute on function public.is_master_admin() to authenticated, service_role;

-- 3) Atualização das policies RLS para contemplar Administrador Master
drop policy if exists redes_select on public.redes;
create policy redes_select on public.redes
  for select to authenticated
  using (id = public.current_rede_id() or public.is_master_admin());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or (rede_id = public.current_rede_id() and public.current_user_role() in ('admin_rede', 'gestor_unidade'))
    or (rede_id is null and public.is_master_admin())
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (
    (rede_id = public.current_rede_id() and public.is_rede_admin())
    or (rede_id is null and public.is_master_admin())
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (
    auth_user_id = auth.uid()
    or (rede_id = public.current_rede_id() and public.is_rede_admin())
    or (rede_id is null and public.is_master_admin())
  )
  with check (
    (rede_id = public.current_rede_id())
    or (rede_id is null and public.is_master_admin())
  );

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (
    (rede_id = public.current_rede_id() and public.is_rede_admin())
    or (rede_id is null and public.is_master_admin())
  );

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    (rede_id = public.current_rede_id() and public.is_rede_admin())
    or (rede_id is null and public.is_master_admin())
  );

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    rede_id = public.current_rede_id()
    or (rede_id is null and public.is_master_admin())
  );

-- 4) Atualização do trigger `handle_new_user` para suportar provisionamento e convite de Master
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_metadata jsonb;
  v_rede_id uuid;
  v_role text;
  v_is_master boolean;
  v_unidades uuid[];
  v_profissional_id uuid;
  v_profile_id uuid;
begin
  if (new.invited_at is not null or new.raw_user_meta_data ->> 'cadastro_pendente' = 'true')
     and coalesce(new.raw_app_meta_data ->> 'cadastro_concluido', 'false') <> 'true' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_metadata := new.raw_app_meta_data -> 'convite';
    if v_metadata is null then
      select jsonb_build_object(
        'rede_id', p.rede_id,
        'role', p.role,
        'unidades_acesso', p.unidades_acesso,
        'profissional_id', p.profissional_id
      ) into v_metadata
      from public.profiles p
      where p.auth_user_id = new.id
        and p.ativo
        and p.deleted_at is null;
    end if;
    if v_metadata is null then
      raise exception 'Convite sem vínculo válido com a plataforma.' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.profiles p
      where p.auth_user_id = new.id
        and (not p.ativo or p.deleted_at is not null)
    ) then
      raise exception 'O cadastro deste usuário foi inativado.' using errcode = '23514';
    end if;
  else
    v_metadata := new.raw_user_meta_data;
  end if;

  v_rede_id := nullif(v_metadata ->> 'rede_id', '')::uuid;
  v_role := coalesce(nullif(v_metadata ->> 'role', ''), 'recepcao');
  v_is_master := (
    v_rede_id is null
    and (
      v_role = 'admin_master'
      or coalesce(v_metadata ->> 'is_master', 'false') = 'true'
    )
  );

  if v_rede_id is null and not v_is_master then
    if tg_op = 'UPDATE' then
      raise exception 'Convite sem rede vinculada.' using errcode = '23514';
    end if;
    return new;
  end if;

  if v_is_master then
    v_role := 'admin_master';
    v_unidades := '{}'::uuid[];
    v_profissional_id := null;
  else
    v_profissional_id := nullif(v_metadata ->> 'profissional_id', '')::uuid;
    v_unidades := array(
      select jsonb_array_elements_text(
        coalesce(v_metadata -> 'unidades_acesso', '[]'::jsonb)
      )
    )::uuid[];

    if tg_op = 'UPDATE' then
      if not exists (
        select 1 from public.redes r
        where r.id = v_rede_id and r.ativo and r.deleted_at is null
      ) then
        raise exception 'A rede do convite não está ativa.' using errcode = '23514';
      end if;
      if exists (
        select 1 from unnest(v_unidades) as acesso(id)
        where not exists (
          select 1 from public.unidades u
          where u.id = acesso.id
            and u.rede_id = v_rede_id
            and u.ativo
            and u.deleted_at is null
        )
      ) then
        raise exception 'Unidade do convite não pertence à rede.' using errcode = '23514';
      end if;
      if v_role = 'profissional' and v_profissional_id is null then
        raise exception 'Convite de profissional sem cadastro vinculado.' using errcode = '23514';
      end if;
      if v_profissional_id is not null and not exists (
        select 1 from public.profissionais p
        where p.id = v_profissional_id
          and p.rede_id = v_rede_id
          and p.ativo
          and p.deleted_at is null
      ) then
        raise exception 'Profissional do convite não pertence à rede.' using errcode = '23514';
      end if;
    end if;
  end if;

  insert into public.profiles (
    auth_user_id, rede_id, nome, email, role, telefone, unidades_acesso, profissional_id
  ) values (
    new.id,
    v_rede_id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    v_role,
    new.raw_user_meta_data ->> 'telefone',
    v_unidades,
    v_profissional_id
  ) on conflict (auth_user_id) do update set
    nome = excluded.nome,
    email = excluded.email,
    telefone = excluded.telefone,
    updated_at = timezone('utc', now())
  returning id into v_profile_id;

  if tg_op = 'UPDATE' then
    insert into public.audit_logs (
      rede_id, user_id, user_nome, user_email, user_role, acao, entidade,
      registro_id, descricao, dados_depois, origem
    ) values (
      v_rede_id,
      v_profile_id,
      new.raw_user_meta_data ->> 'nome',
      new.email,
      v_role,
      'criar',
      'profiles',
      v_profile_id::text,
      'Conclusão do cadastro por convite',
      jsonb_build_object('id', v_profile_id, 'auth_user_id', new.id),
      'convite'
    );
  end if;
  return new;
end;
$$;

-- 5) RPC de Resumo e Estatísticas Globais de Redes para Administrador Master
create or replace function public.resumo_master_redes()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_indicadores jsonb;
  v_redes jsonb;
begin
  if not public.is_master_admin() then
    raise exception 'Acesso restrito ao Administrador Master.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_redes', (
      select count(*) from public.redes r where r.deleted_at is null
    ),
    'redes_ativas', (
      select count(*) from public.redes r where r.deleted_at is null and r.ativo
    ),
    'total_unidades', (
      select count(*) from public.unidades u where u.deleted_at is null and u.ativo
    ),
    'total_usuarios_rede', (
      select count(*) from public.profiles p where p.rede_id is not null and p.deleted_at is null and p.ativo
    ),
    'total_usuarios_master', (
      select count(*) from public.profiles p where p.rede_id is null and p.deleted_at is null and p.ativo
    ),
    'total_profissionais', (
      select count(*) from public.profissionais pr where pr.deleted_at is null and pr.ativo
    ),
    'total_pacientes', (
      select count(*) from public.pacientes pa where pa.deleted_at is null and pa.ativo
    ),
    'consultas_hoje', (
      select count(*)
      from public.agendamentos a
      join public.unidades u on u.id = a.unidade_id
      where a.deleted_at is null
        and (a.data_hora_inicio at time zone u.timezone)::date = (timezone('utc', now()) at time zone u.timezone)::date
    ),
    'atendimentos_30d', (
      select count(*)
      from public.agendamentos a
      where a.deleted_at is null
        and a.status = 'finalizado'
        and a.data_hora_inicio >= timezone('utc', now()) - interval '30 days'
    ),
    'gerado_em', timezone('utc', now())
  ) into v_indicadores;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'nome', r.nome,
        'razao_social', r.razao_social,
        'cnpj', r.cnpj,
        'slug', r.slug,
        'email', r.email,
        'telefone', r.telefone,
        'logotipo_url', r.logotipo_url,
        'ativo', r.ativo,
        'created_at', r.created_at,
        'unidades_ativas', (
          select count(*)
          from public.unidades u
          where u.rede_id = r.id and u.deleted_at is null and u.ativo
        ),
        'usuarios_ativos', (
          select count(*)
          from public.profiles p
          where p.rede_id = r.id and p.deleted_at is null and p.ativo
        ),
        'profissionais_ativos', (
          select count(*)
          from public.profissionais pr
          where pr.rede_id = r.id and pr.deleted_at is null and pr.ativo
        ),
        'pacientes_ativos', (
          select count(*)
          from public.pacientes pa
          where pa.rede_id = r.id and pa.deleted_at is null and pa.ativo
        ),
        'consultas_hoje', (
          select count(*)
          from public.agendamentos a
          join public.unidades u on u.id = a.unidade_id
          where a.rede_id = r.id
            and a.deleted_at is null
            and (a.data_hora_inicio at time zone u.timezone)::date = (timezone('utc', now()) at time zone u.timezone)::date
        ),
        'atendimentos_30d', (
          select count(*)
          from public.agendamentos a
          where a.rede_id = r.id
            and a.deleted_at is null
            and a.status = 'finalizado'
            and a.data_hora_inicio >= timezone('utc', now()) - interval '30 days'
        )
      )
      order by r.nome asc
    ),
    '[]'::jsonb
  )
  into v_redes
  from public.redes r
  where r.deleted_at is null;

  return jsonb_build_object(
    'indicadores', v_indicadores,
    'redes', v_redes
  );
end;
$$;

grant execute on function public.resumo_master_redes() to authenticated, service_role;

