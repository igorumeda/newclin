-- =============================================================================
-- Clínica SaaS v1.0 — 07 · Notificações (e-mail e WhatsApp)
-- =============================================================================
-- Regras de negócio atendidas (§4.1 e §4.2):
--   - Envio assíncrono e enfileirado (não bloqueia a resposta da API).
--   - Log de tudo que foi enviado/recebido, com status, destinatário e timestamp.
--   - Templates internos com variáveis dinâmicas.
--   - Fluxo de confirmação via WhatsApp com webhook que atualiza o agendamento.
--   - Fallback: falha no WhatsApp tenta e-mail quando o paciente possui e-mail.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Modelos de mensagem (templates internos por rede e canal)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.modelos_mensagem (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  canal text not null,
  tipo text not null,
  assunto text,
  corpo text not null,
  ativo boolean not null default true,
  is_padrao boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint modelos_mensagem_canal_valido check (canal in ('email', 'whatsapp')),
  constraint modelos_mensagem_tipo_valido check (tipo in ('confirmacao', 'lembrete', 'documento', 'cancelamento'))
);

comment on column public.modelos_mensagem.corpo is
  'Corpo da mensagem com variáveis dinâmicas no formato {{variavel}} (ex.: {{paciente_nome}}).';

create unique index if not exists modelos_mensagem_uidx
  on public.modelos_mensagem (rede_id, canal, tipo) where deleted_at is null;

drop trigger if exists trg_modelos_mensagem_updated_at on public.modelos_mensagem;
create trigger trg_modelos_mensagem_updated_at before update on public.modelos_mensagem
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Fila e log de notificações
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.notificacoes (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  agendamento_id uuid references public.agendamentos (id) on delete set null,
  paciente_id uuid references public.pacientes (id) on delete set null,
  atendimento_id uuid references public.atendimentos (id) on delete set null,
  documento_id uuid references public.documentos (id) on delete set null,
  canal text not null,
  tipo text not null,
  destinatario text not null,
  remetente text,
  assunto text,
  conteudo text not null,
  status text not null default 'pendente',
  provider text,
  provider_message_id text,
  tentativas integer not null default 0,
  ultimo_erro text,
  agendada_para timestamptz not null default timezone('utc', now()),
  enviada_em timestamptz,
  entregue_em timestamptz,
  respondida_em timestamptz,
  resposta text,
  resposta_acao text,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint notificacoes_canal_valido check (canal in ('email', 'whatsapp')),
  constraint notificacoes_tipo_valido check (tipo in ('confirmacao', 'lembrete', 'documento', 'cancelamento')),
  constraint notificacoes_status_valido check (
    status in ('pendente', 'enviado', 'entregue', 'lido', 'respondido', 'falha', 'cancelado')
  ),
  constraint notificacoes_resposta_acao_valida check (
    resposta_acao is null or resposta_acao in ('confirmar', 'cancelar')
  )
);

comment on table public.notificacoes is
  'Fila (status pendente) e log (demais status) das mensagens enviadas por e-mail e WhatsApp.';

-- Índice de processamento da fila.
create index if not exists notificacoes_fila_idx
  on public.notificacoes (status, agendada_para)
  where status = 'pendente' and deleted_at is null and tentativas < 3;

create index if not exists notificacoes_agendamento_idx
  on public.notificacoes (rede_id, agendamento_id, created_at desc);

create index if not exists notificacoes_paciente_idx
  on public.notificacoes (rede_id, paciente_id, created_at desc);

create unique index if not exists notificacoes_provider_message_uidx
  on public.notificacoes (canal, provider_message_id) where provider_message_id is not null;

drop trigger if exists trg_notificacoes_updated_at on public.notificacoes;
create trigger trg_notificacoes_updated_at before update on public.notificacoes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Templates padrão por rede
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.seed_modelos_mensagem_padrao(p_rede_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.modelos_mensagem (rede_id, canal, tipo, assunto, corpo, is_padrao)
  values
    (
      p_rede_id, 'email', 'confirmacao',
      'Confirmação de consulta — {{unidade_nome}}',
      E'Olá, {{paciente_nome}}!\n\nSua consulta está agendada:\n\n📅 Data: {{data}}\n🕐 Horário: {{hora}}\n👨‍⚕️ Profissional: {{profissional_nome}}\n🏥 Unidade: {{unidade_nome}}\n📍 Endereço: {{unidade_endereco}}\n\nSe não puder comparecer, avise-nos com antecedência.\n\nAtenciosamente,\n{{rede_nome}}',
      true
    ),
    (
      p_rede_id, 'email', 'lembrete',
      'Lembrete: consulta em {{data}} às {{hora}}',
      E'Olá, {{paciente_nome}}!\n\nEste é um lembrete da sua consulta:\n\n📅 {{data}} às {{hora}}\n👨‍⚕️ {{profissional_nome}}\n🏥 {{unidade_nome}}\n\nConfirme sua presença respondendo este e-mail ou entrando em contato.\n\nAtenciosamente,\n{{rede_nome}}',
      true
    ),
    (
      p_rede_id, 'email', 'documento',
      'Documento clínico — {{tipo_documento}}',
      E'Olá, {{paciente_nome}}!\n\nSegue o documento clínico emitido em {{data_emissao}} por {{profissional_nome}}.\n\nAtenciosamente,\n{{rede_nome}}',
      true
    ),
    (
      p_rede_id, 'email', 'cancelamento',
      'Consulta cancelada — {{data}}',
      E'Olá, {{paciente_nome}}.\n\nSua consulta de {{data}} às {{hora}} com {{profissional_nome}} na unidade {{unidade_nome}} foi cancelada.\n\nEntre em contato para reagendar.\n\nAtenciosamente,\n{{rede_nome}}',
      true
    ),
    (
      p_rede_id, 'whatsapp', 'confirmacao',
      null,
      E'Olá, {{paciente_nome}}! 👋\n\nSua consulta está agendada:\n📅 {{data}}\n🕐 {{hora}}\n👨‍⚕️ {{profissional_nome}}\n🏥 {{unidade_nome}}\n\nResponda *1* para confirmar ou *2* para cancelar.',
      true
    ),
    (
      p_rede_id, 'whatsapp', 'lembrete',
      null,
      E'Lembrete de consulta 💙\n\n{{paciente_nome}}, sua consulta é {{data}} às {{hora}} com {{profissional_nome}} na unidade {{unidade_nome}}.\n\nResponda *1* para confirmar ou *2* para cancelar.',
      true
    ),
    (
      p_rede_id, 'whatsapp', 'cancelamento',
      null,
      'Olá, {{paciente_nome}}. Sua consulta de {{data}} às {{hora}} foi cancelada. Entre em contato para reagendar. 💙',
      true
    ),
    (
      p_rede_id, 'whatsapp', 'documento',
      null,
      'Olá, {{paciente_nome}}! Seu documento clínico ({{tipo_documento}}) foi emitido. Acesse o sistema para baixá-lo. 💙',
      true
    )
  on conflict do nothing;
$$;

create or replace function public.on_rede_created_seed_modelos()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.seed_modelos_mensagem_padrao(new.id);
  return new;
end;
$$;

drop trigger if exists trg_redes_seed_modelos on public.redes;
create trigger trg_redes_seed_modelos after insert on public.redes
  for each row execute function public.on_rede_created_seed_modelos();

grant execute on function public.seed_modelos_mensagem_padrao(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Reserva atômica de mensagens da fila (evita envio duplicado entre workers)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.reservar_notificacoes(p_limite integer default 25)
returns setof public.notificacoes
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.notificacoes n
     set status = 'pendente',
         tentativas = n.tentativas + 1,
         updated_at = timezone('utc', now())
   where n.id in (
     select id
       from public.notificacoes
      where status = 'pendente'
        and deleted_at is null
        and agendada_para <= timezone('utc', now())
        and tentativas < 3
      order by agendada_para asc
      limit greatest(p_limite, 1)
      for update skip locked
   )
   returning n.*;
$$;

grant execute on function public.reservar_notificacoes(integer) to service_role;
