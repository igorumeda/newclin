-- =============================================================================
-- Clínica SaaS v1.0 — 12 · Exportação de dados do paciente (LGPD)
-- =============================================================================
-- A função é definida aqui — e não junto da tabela de pacientes — porque o
-- corpo é validado na criação (`check_function_bodies`) e precisa que as
-- tabelas `agendamentos`, `atendimentos`, `documentos` e `anexos` já existam.
-- Atende ao §5 da spec: o paciente (ou a Recepção, a seu pedido) obtém todos os
-- dados pessoais e clínicos vinculados em um único JSON.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Exportação LGPD: dados legíveis do paciente (§5 - LGPD)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.exportar_dados_paciente(p_paciente_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'paciente', to_jsonb(p) - 'deleted_at',
    'agendamentos', coalesce((
      select jsonb_agg(to_jsonb(a) - 'deleted_at' order by a.data_hora_inicio)
      from public.agendamentos a
      where a.paciente_id = p.id and a.deleted_at is null
    ), '[]'::jsonb),
    'atendimentos', coalesce((
      select jsonb_agg(to_jsonb(t) - 'deleted_at' order by t.iniciado_em)
      from public.atendimentos t
      where t.paciente_id = p.id and t.deleted_at is null
    ), '[]'::jsonb),
    'documentos', coalesce((
      select jsonb_agg(to_jsonb(d) - 'deleted_at' order by d.created_at)
      from public.documentos d
      where d.paciente_id = p.id and d.deleted_at is null
    ), '[]'::jsonb),
    'anexos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', an.id,
          'nome_arquivo', an.nome_arquivo,
          'mime_type', an.mime_type,
          'tamanho_bytes', an.tamanho_bytes,
          'created_at', an.created_at
        ) order by an.created_at
      )
      from public.anexos an
      where an.paciente_id = p.id and an.deleted_at is null
    ), '[]'::jsonb),
    'gerado_em', timezone('utc', now())
  )
  from public.pacientes p
  where p.id = p_paciente_id
    and p.rede_id = public.current_rede_id()
    and p.deleted_at is null;
$$;

grant execute on function public.exportar_dados_paciente(uuid) to authenticated, service_role;
