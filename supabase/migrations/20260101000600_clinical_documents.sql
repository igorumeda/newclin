-- =============================================================================
-- Clínica SaaS v1.0 — 06 · Documentos clínicos
-- =============================================================================
-- Regras de negócio atendidas (§3.6):
--   - Receita, atestado, solicitação de exames e declaração de comparecimento.
--   - Documentos vinculados ao atendimento e ao paciente; histórico no prontuário.
--   - Conteúdo editável antes da emissão; imutável após a emissão (PDF armazenado).
--   - Cabeçalho com logotipo da rede, nome/endereço/telefone da unidade.
-- =============================================================================

create table if not exists public.documentos (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  atendimento_id uuid references public.atendimentos (id) on delete set null,
  profissional_id uuid not null references public.profissionais (id) on delete restrict,
  tipo text not null,
  numero integer not null default 0,
  conteudo jsonb not null default '{}'::jsonb,
  status text not null default 'rascunho',
  storage_bucket text not null default 'documentos',
  storage_path text,
  emitido_em timestamptz,
  emitido_por uuid,
  cancelado_em timestamptz,
  motivo_cancelamento text,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint documentos_tipo_valido check (
    tipo in ('receita', 'atestado', 'solicitacao_exames', 'declaracao_comparecimento')
  ),
  constraint documentos_status_valido check (status in ('rascunho', 'emitido', 'cancelado')),
  constraint documentos_emissao_valida check (
    (status = 'emitido' and emitido_em is not null and storage_path is not null)
    or status <> 'emitido'
  )
);

comment on table public.documentos is
  'Documentos clínicos emitidos em PDF. O PDF é armazenado no bucket `documentos` e o registro torna-se imutável após a emissão.';

create unique index if not exists documentos_numeracao_uidx
  on public.documentos (rede_id, tipo, numero) where numero > 0 and deleted_at is null;

create index if not exists documentos_paciente_idx
  on public.documentos (rede_id, paciente_id, created_at desc) where deleted_at is null;
create index if not exists documentos_atendimento_idx
  on public.documentos (rede_id, atendimento_id) where deleted_at is null;

drop trigger if exists trg_documentos_updated_at on public.documentos;
create trigger trg_documentos_updated_at before update on public.documentos
  for each row execute function public.set_updated_at();

-- Numeração sequencial por rede e tipo (usa advisory lock para evitar corrida).
create or replace function public.proximo_numero_documento()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.numero is null or new.numero = 0 then
    perform pg_advisory_xact_lock(hashtext(new.rede_id::text || new.tipo));
    select coalesce(max(d.numero), 0) + 1
      into new.numero
      from public.documentos d
     where d.rede_id = new.rede_id
       and d.tipo = new.tipo;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_documentos_numeracao on public.documentos;
create trigger trg_documentos_numeracao before insert on public.documentos
  for each row execute function public.proximo_numero_documento();

-- Imutabilidade após a emissão: apenas cancelamento é permitido.
create or replace function public.proteger_documento_emitido()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'emitido' then
      raise exception 'Documento emitido não pode ser excluído. Cancele o documento.'
        using errcode = '23514';
    end if;
    return old;
  end if;

  if old.status = 'emitido' and new.status not in ('emitido', 'cancelado') then
    raise exception 'Documento emitido é imutável.'
      using errcode = '23514';
  end if;

  if old.status = 'emitido' and new.status = 'emitido' then
    if new.conteudo is distinct from old.conteudo
       or new.storage_path is distinct from old.storage_path
       or new.numero is distinct from old.numero
       or new.paciente_id is distinct from old.paciente_id then
      raise exception 'Documento emitido é imutável. Emita um novo documento para corrigir.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_documentos_imutavel on public.documentos;
create trigger trg_documentos_imutavel before update or delete on public.documentos
  for each row execute function public.proteger_documento_emitido();
