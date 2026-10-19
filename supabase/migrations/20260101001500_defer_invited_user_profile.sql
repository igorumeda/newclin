-- Convites criam somente uma identidade técnica no Auth, sem profile/acesso.
-- A conclusão pelo backend cria o profile na mesma transação da senha do Auth.
-- Convites legados mantêm seus perfis e continuam podendo concluir o cadastro.
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
  v_unidades uuid[];
  v_profissional_id uuid;
  v_profile_id uuid;
begin
  if (new.invited_at is not null or new.raw_user_meta_data ->> 'cadastro_pendente' = 'true')
     and coalesce(new.raw_app_meta_data ->> 'cadastro_concluido', 'false') <> 'true' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Permissões não vêm de user_metadata, pois o próprio usuário pode alterá-lo.
    v_metadata := new.raw_app_meta_data -> 'convite';
    if v_metadata is null then
      select jsonb_build_object(
        'rede_id', p.rede_id, 'role', p.role,
        'unidades_acesso', p.unidades_acesso, 'profissional_id', p.profissional_id
      ) into v_metadata from public.profiles p
      where p.auth_user_id = new.id and p.ativo and p.deleted_at is null;
    end if;
    if v_metadata is null then
      raise exception 'Convite sem vínculo válido com a rede.' using errcode = '23514';
    end if;
    if exists (select 1 from public.profiles p where p.auth_user_id = new.id
      and (not p.ativo or p.deleted_at is not null)) then
      raise exception 'O cadastro deste usuário foi inativado.' using errcode = '23514';
    end if;
  else
    -- Preserva o provisionamento direto, inclusive seed e contas sem convite.
    v_metadata := new.raw_user_meta_data;
  end if;

  v_rede_id := nullif(v_metadata ->> 'rede_id', '')::uuid;
  if v_rede_id is null then
    if tg_op = 'UPDATE' then
      raise exception 'Convite sem rede vinculada.' using errcode = '23514';
    end if;
    return new;
  end if;
  v_role := coalesce(nullif(v_metadata ->> 'role', ''), 'recepcao');
  v_profissional_id := nullif(v_metadata ->> 'profissional_id', '')::uuid;
  v_unidades := array(select jsonb_array_elements_text(
    coalesce(v_metadata -> 'unidades_acesso', '[]'::jsonb)
  ))::uuid[];

  if tg_op = 'UPDATE' then
    if not exists (select 1 from public.redes r
      where r.id = v_rede_id and r.ativo and r.deleted_at is null) then
      raise exception 'A rede do convite não está ativa.' using errcode = '23514';
    end if;
    if exists (select 1 from unnest(v_unidades) as acesso(id)
      where not exists (select 1 from public.unidades u
        where u.id = acesso.id and u.rede_id = v_rede_id and u.ativo and u.deleted_at is null)) then
      raise exception 'Unidade do convite não pertence à rede.' using errcode = '23514';
    end if;
    if v_role = 'profissional' and v_profissional_id is null then
      raise exception 'Convite de profissional sem cadastro vinculado.' using errcode = '23514';
    end if;
    if v_profissional_id is not null and not exists (
      select 1 from public.profissionais p where p.id = v_profissional_id
        and p.rede_id = v_rede_id and p.ativo and p.deleted_at is null
    ) then
      raise exception 'Profissional do convite não pertence à rede.' using errcode = '23514';
    end if;
  end if;

  insert into public.profiles (
    auth_user_id, rede_id, nome, email, role, telefone, unidades_acesso, profissional_id
  ) values (
    new.id, v_rede_id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''), v_role, new.raw_user_meta_data ->> 'telefone',
    v_unidades, v_profissional_id
  ) on conflict (auth_user_id) do update set
    nome = excluded.nome, email = excluded.email, telefone = excluded.telefone,
    updated_at = timezone('utc', now())
  returning id into v_profile_id;

  if tg_op = 'UPDATE' then
    -- A chamada administrativa do Auth não carrega auth.uid(); registra o próprio
    -- convidado que acabou de concluir o cadastro como autor desta ação.
    insert into public.audit_logs (
      rede_id, user_id, user_nome, user_email, user_role, acao, entidade,
      registro_id, descricao, dados_depois, origem
    ) values (
      v_rede_id, v_profile_id, new.raw_user_meta_data ->> 'nome', new.email, v_role,
      'criar', 'profiles', v_profile_id::text, 'Conclusão do cadastro por convite',
      jsonb_build_object('id', v_profile_id, 'auth_user_id', new.id), 'convite'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_invite_completed on auth.users;
create trigger on_auth_invite_completed
  after update of raw_app_meta_data on auth.users
  for each row
  when (
    new.invited_at is not null
    and coalesce(old.raw_app_meta_data ->> 'cadastro_concluido', 'false') <> 'true'
    and new.raw_app_meta_data ->> 'cadastro_concluido' = 'true'
  ) execute function public.handle_new_user();
