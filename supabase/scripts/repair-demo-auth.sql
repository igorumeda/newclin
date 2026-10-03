-- Executar no SQL Editor para reparar os usuários criados pelo seed antigo.
-- Preserva senhas, identidades e tokens existentes; normaliza somente NULLs.
update auth.users
set confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    phone_change = coalesce(phone_change, ''),
    phone_change_token = coalesce(phone_change_token, ''),
    reauthentication_token = coalesce(reauthentication_token, '')
where (id, email) in (
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid, 'admin@clinica.exemplo.com'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid, 'gestor@clinica.exemplo.com'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid, 'medico@clinica.exemplo.com'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'::uuid, 'recepcao@clinica.exemplo.com')
)
and (
  confirmation_token is null or recovery_token is null or email_change is null
  or email_change_token_new is null or email_change_token_current is null
  or phone_change is null or phone_change_token is null or reauthentication_token is null
)
returning email;
