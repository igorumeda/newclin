-- =============================================================================
-- Clínica SaaS v1.0 — 11 · Relatórios operacionais
-- =============================================================================
-- Regras de negócio atendidas (§3.8):
--   - Total de atendimentos por período (filtrável por unidade e profissional).
--   - Taxa de faltas e cancelamentos por período e por profissional.
--   - Novos pacientes cadastrados por mês.
--   - Distribuição de atendimentos por tipo e por especialidade.
--   - Produtividade por profissional (atendimentos/dia).
--   Todas as funções são SECURITY INVOKER: a RLS continua aplicada e o isolamento
--   por rede é garantido por `public.current_rede_id()`.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Total de atendimentos por período (série diária + totais)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.relatorio_atendimentos(
  p_inicio date,
  p_fim date,
  p_unidade_id uuid default null,
  p_profissional_id uuid default null
)
returns table (
  data date,
  unidade_id uuid,
  unidade_nome text,
  total_agendados bigint,
  total_finalizados bigint,
  total_cancelados bigint,
  total_faltas bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    (a.data_hora_inicio at time zone u.timezone)::date as data,
    u.id as unidade_id,
    u.nome as unidade_nome,
    count(*) as total_agendados,
    count(*) filter (where a.status = 'finalizado') as total_finalizados,
    count(*) filter (where a.status = 'cancelado') as total_cancelados,
    count(*) filter (where a.status = 'faltou') as total_faltas
  from public.agendamentos a
  join public.unidades u on u.id = a.unidade_id
  where a.rede_id = public.current_rede_id()
    and a.deleted_at is null
    and (a.data_hora_inicio at time zone u.timezone)::date between p_inicio and p_fim
    and (p_unidade_id is null or a.unidade_id = p_unidade_id)
    and (p_profissional_id is null or a.profissional_id = p_profissional_id)
  group by 1, 2, 3
  order by 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Taxa de faltas e cancelamentos por profissional
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.relatorio_faltas_cancelamentos(
  p_inicio date,
  p_fim date,
  p_unidade_id uuid default null,
  p_profissional_id uuid default null
)
returns table (
  profissional_id uuid,
  profissional_nome text,
  especialidade text,
  unidade_id uuid,
  unidade_nome text,
  total_agendamentos bigint,
  total_faltas bigint,
  total_cancelamentos bigint,
  total_finalizados bigint,
  taxa_faltas numeric,
  taxa_cancelamentos numeric
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    pr.id,
    pr.nome,
    pr.especialidade,
    u.id,
    u.nome,
    count(*),
    count(*) filter (where a.status = 'faltou'),
    count(*) filter (where a.status = 'cancelado'),
    count(*) filter (where a.status = 'finalizado'),
    round((count(*) filter (where a.status = 'faltou'))::numeric * 100 / greatest(count(*), 1), 2),
    round((count(*) filter (where a.status = 'cancelado'))::numeric * 100 / greatest(count(*), 1), 2)
  from public.agendamentos a
  join public.profissionais pr on pr.id = a.profissional_id
  join public.unidades u on u.id = a.unidade_id
  where a.rede_id = public.current_rede_id()
    and a.deleted_at is null
    and (a.data_hora_inicio at time zone u.timezone)::date between p_inicio and p_fim
    and (p_unidade_id is null or a.unidade_id = p_unidade_id)
    and (p_profissional_id is null or a.profissional_id = p_profissional_id)
  group by 1, 2, 3, 4, 5
  order by 6 desc;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Novos pacientes cadastrados por mês
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.relatorio_novos_pacientes(
  p_inicio date,
  p_fim date
)
returns table (
  mes date,
  total_pacientes bigint,
  com_consentimento_lgpd bigint,
  total_inativos bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    date_trunc('month', p.created_at)::date as mes,
    count(*),
    count(*) filter (where p.consentimento_lgpd),
    count(*) filter (where not p.ativo)
  from public.pacientes p
  where p.rede_id = public.current_rede_id()
    and p.deleted_at is null
    and p.created_at::date between p_inicio and p_fim
  group by 1
  order by 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Distribuição de atendimentos por tipo e por especialidade
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.relatorio_distribuicao(
  p_inicio date,
  p_fim date,
  p_unidade_id uuid default null
)
returns table (
  dimensao text,
  rotulo text,
  cor text,
  total bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select 'tipo'::text, coalesce(t.nome, 'Não informado'), coalesce(t.cor, '#94a3b8'), count(*)
    from public.agendamentos a
    left join public.tipos_atendimento t on t.id = a.tipo_atendimento_id
    join public.unidades u on u.id = a.unidade_id
   where a.rede_id = public.current_rede_id()
     and a.deleted_at is null
     and a.status not in ('cancelado', 'faltou')
     and (a.data_hora_inicio at time zone u.timezone)::date between p_inicio and p_fim
     and (p_unidade_id is null or a.unidade_id = p_unidade_id)
   group by 2, 3
  union all
  select 'especialidade'::text, coalesce(pr.especialidade, 'Não informada'), '#0ea5e9', count(*)
    from public.agendamentos a
    join public.profissionais pr on pr.id = a.profissional_id
    join public.unidades u on u.id = a.unidade_id
   where a.rede_id = public.current_rede_id()
     and a.deleted_at is null
     and a.status not in ('cancelado', 'faltou')
     and (a.data_hora_inicio at time zone u.timezone)::date between p_inicio and p_fim
     and (p_unidade_id is null or a.unidade_id = p_unidade_id)
   group by 2
  order by 1, 4 desc;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) Produtividade por profissional (atendimentos/dia)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.relatorio_produtividade(
  p_inicio date,
  p_fim date,
  p_unidade_id uuid default null
)
returns table (
  profissional_id uuid,
  profissional_nome text,
  especialidade text,
  unidade_id uuid,
  unidade_nome text,
  total_atendimentos bigint,
  dias_com_atendimento bigint,
  media_atendimentos_dia numeric,
  total_evolucoes bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    pr.id,
    pr.nome,
    pr.especialidade,
    u.id,
    u.nome,
    count(*) filter (where a.status = 'finalizado'),
    count(distinct (a.data_hora_inicio at time zone u.timezone)::date) filter (where a.status = 'finalizado'),
    round(
      (count(*) filter (where a.status = 'finalizado'))::numeric
      / greatest(count(distinct (a.data_hora_inicio at time zone u.timezone)::date) filter (where a.status = 'finalizado'), 1),
      2
    ),
    (
      select count(*)
        from public.atendimentos at
       where at.profissional_id = pr.id
         and at.deleted_at is null
         and at.status = 'finalizado'
         and at.iniciado_em::date between p_inicio and p_fim
    )
  from public.agendamentos a
  join public.profissionais pr on pr.id = a.profissional_id
  join public.unidades u on u.id = a.unidade_id
  where a.rede_id = public.current_rede_id()
    and a.deleted_at is null
    and (a.data_hora_inicio at time zone u.timezone)::date between p_inicio and p_fim
    and (p_unidade_id is null or a.unidade_id = p_unidade_id)
  group by 1, 2, 3, 4, 5
  order by 6 desc;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indicadores do dashboard (painel inicial)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.indicadores_dashboard(
  p_unidade_id uuid default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'consultas_hoje', (
      select count(*)
        from public.agendamentos a
        join public.unidades u on u.id = a.unidade_id
       where a.rede_id = public.current_rede_id()
         and a.deleted_at is null
         and (a.data_hora_inicio at time zone u.timezone)::date = (timezone('utc', now()) at time zone u.timezone)::date
         and (p_unidade_id is null or a.unidade_id = p_unidade_id)
    ),
    'pacientes_aguardando', (
      select count(*)
        from public.agendamentos a
       where a.rede_id = public.current_rede_id()
         and a.deleted_at is null
         and a.status = 'aguardando'
         and (p_unidade_id is null or a.unidade_id = p_unidade_id)
    ),
    'em_atendimento', (
      select count(*)
        from public.agendamentos a
       where a.rede_id = public.current_rede_id()
         and a.deleted_at is null
         and a.status = 'em_atendimento'
         and (p_unidade_id is null or a.unidade_id = p_unidade_id)
    ),
    'pacientes_ativos', (
      select count(*)
        from public.pacientes p
       where p.rede_id = public.current_rede_id()
         and p.deleted_at is null
         and p.ativo
    ),
    'profissionais_ativos', (
      select count(*)
        from public.profissionais pr
       where pr.rede_id = public.current_rede_id()
         and pr.deleted_at is null
         and pr.ativo
    ),
    'taxa_faltas_30d', (
      select coalesce(round(count(*) filter (where a.status = 'faltou')::numeric * 100 / greatest(count(*), 1), 2), 0)
        from public.agendamentos a
       where a.rede_id = public.current_rede_id()
         and a.deleted_at is null
         and a.data_hora_inicio >= timezone('utc', now()) - interval '30 days'
         and (p_unidade_id is null or a.unidade_id = p_unidade_id)
    ),
    'gerado_em', timezone('utc', now())
  );
$$;

grant execute on function public.relatorio_atendimentos(date, date, uuid, uuid) to authenticated, service_role;
grant execute on function public.relatorio_faltas_cancelamentos(date, date, uuid, uuid) to authenticated, service_role;
grant execute on function public.relatorio_novos_pacientes(date, date) to authenticated, service_role;
grant execute on function public.relatorio_distribuicao(date, date, uuid) to authenticated, service_role;
grant execute on function public.relatorio_produtividade(date, date, uuid) to authenticated, service_role;
grant execute on function public.indicadores_dashboard(uuid) to authenticated, service_role;
