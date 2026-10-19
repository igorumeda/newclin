-- =============================================================================
-- Clínica SaaS v1.0 — 10 · Storage (Supabase Storage)
-- =============================================================================
-- Regras de negócio atendidas (§4.3):
--   - Organização por rede e, quando aplicável, por paciente:
--       logos/{rede_id}/...
--       anexos/{rede_id}/{paciente_id}/...
--       documentos/{rede_id}/{documento_id}/...
--   - Acesso restrito a usuários da mesma rede; anexos e documentos NÃO são
--     públicos (uso de URLs assinadas com expiração).
--   - Tipos permitidos: PDF, JPG e PNG. Limite de 10 MB por arquivo.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos', 'logos', true, 5242880, array['image/jpeg', 'image/png', 'image/svg+xml']),
  ('anexos', 'anexos', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('documentos', 'documentos', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────────
-- Logotipos: leitura pública (exibidos em sidebar e documentos), escrita do
-- Admin da Rede apenas na própria pasta.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists logos_select on storage.objects;
create policy logos_select on storage.objects
  for select to public
  using (bucket_id = 'logos');

drop policy if exists logos_insert on storage.objects;
create policy logos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and public.is_rede_admin()
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  );

drop policy if exists logos_update on storage.objects;
create policy logos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and public.is_rede_admin()
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  )
  with check (
    bucket_id = 'logos'
    and public.is_rede_admin()
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  );

drop policy if exists logos_delete on storage.objects;
create policy logos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and public.is_rede_admin()
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Anexos de prontuário (privados)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists anexos_storage_select on storage.objects;
create policy anexos_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
    and public.current_user_role() in ('admin_rede', 'gestor_unidade', 'profissional')
  );

drop policy if exists anexos_storage_insert on storage.objects;
create policy anexos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
    and public.current_user_role() in ('admin_rede', 'profissional')
  );

drop policy if exists anexos_storage_delete on storage.objects;
create policy anexos_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
    and public.current_user_role() in ('admin_rede', 'profissional')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Documentos clínicos em PDF (privados)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists documentos_storage_select on storage.objects;
create policy documentos_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
    and public.current_user_role() in ('admin_rede', 'gestor_unidade', 'profissional', 'recepcao')
  );

drop policy if exists documentos_storage_insert on storage.objects;
create policy documentos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  );

drop policy if exists documentos_storage_update on storage.objects;
create policy documentos_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  )
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.current_rede_id()::text
  );
