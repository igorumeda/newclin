-- Remoção definitiva de uma conta. Execute o arquivo inteiro no SQL Editor
-- do Supabase, com acesso administrativo. Altere somente v_usuario_id abaixo.
-- Aceita public.profiles.id (ID do sistema) ou auth.users.id (ID do Auth).
-- Remove a identidade e o perfil por ON DELETE CASCADE; não exclui profissionais,
-- pacientes, agendamentos, prontuários, documentos ou logs de auditoria.
-- Qualquer erro desfaz a operação inteira, inclusive o novo log de auditoria.
-- Referência: https://supabase.com/docs/guides/auth/managing-user-data

begin;

do $$
declare
  v_usuario_id uuid := null; -- Substitua null por 'UUID-DO-USUARIO'::uuid.
  v_candidatos uuid[];
  v_auth_user_id uuid;
  v_email text;
  v_profile public.profiles%rowtype;
begin
  if v_usuario_id is null then
    raise exception 'Informe o ID do usuário em v_usuario_id antes de executar.';
  end if;

  -- Resolve os dois tipos de ID sem escolher arbitrariamente em caso de colisão.
  select array_agg(candidato.auth_user_id)
    into v_candidatos
    from (
      select u.id as auth_user_id
        from auth.users u
        where u.id = v_usuario_id
      union
      select p.auth_user_id
        from public.profiles p
        where p.id = v_usuario_id
    ) candidato;

  if coalesce(cardinality(v_candidatos), 0) = 0 then
    raise notice 'Usuário % não encontrado. Nenhum registro foi alterado.', v_usuario_id;
    return;
  end if;

  if cardinality(v_candidatos) > 1 then
    raise exception 'O ID % corresponde a duas contas distintas. Consulte auth.users e public.profiles antes de remover.', v_usuario_id;
  end if;

  v_auth_user_id := v_candidatos[1];

  select u.email into v_email
    from auth.users u
    where u.id = v_auth_user_id
    for update;

  if not found then
    raise exception 'A identidade Auth % não existe. Nenhum registro foi alterado.', v_auth_user_id;
  end if;

  select p.* into v_profile
    from public.profiles p
    where p.auth_user_id = v_auth_user_id
    for update;

  -- Não apague metadados de storage.objects por SQL: isso não remove os arquivos.
  -- A leitura por JSON suporta as colunas owner e owner_id das versões do Storage.
  if exists (
    select 1
      from storage.objects o
      where to_jsonb(o) ->> 'owner_id' = v_auth_user_id::text
         or to_jsonb(o) ->> 'owner' = v_auth_user_id::text
  ) then
    raise exception 'A conta % possui arquivos no Storage. Transfira a propriedade ou remova os arquivos pelo Storage antes de executar novamente.', v_auth_user_id;
  end if;

  if v_profile.id is not null then
    perform public.registrar_auditoria(
      p_acao => 'excluir',
      p_entidade => 'profiles',
      p_registro_id => v_profile.id::text,
      p_rede_id => v_profile.rede_id,
      p_descricao => 'Remoção definitiva da conta por script administrativo; executor SQL: ' || session_user,
      p_dados_antes => jsonb_build_object(
        'id', v_profile.id,
        'auth_user_id', v_auth_user_id,
        'nome', v_profile.nome,
        'email', v_profile.email,
        'role', v_profile.role,
        'ativo', v_profile.ativo
      ),
      p_origem => 'script'
    );
  end if;

  -- A FK profiles.auth_user_id remove o perfil associado automaticamente.
  -- As FKs do Auth cuidam dos registros dependentes da identidade.
  delete from auth.users where id = v_auth_user_id;

  raise notice 'Conta removida: e-mail=%, auth_user_id=%, profile_id=%',
    v_email, v_auth_user_id, v_profile.id;
end;
$$;

commit;
