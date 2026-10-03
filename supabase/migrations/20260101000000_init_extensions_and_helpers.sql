-- =============================================================================
-- Clínica SaaS v1.0 — 00 · Extensões, funções utilitárias e triggers base
-- =============================================================================
-- Executada primeiro: define as extensões e helpers usados por todas as tabelas.
-- =============================================================================

create schema if not exists extensions;

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "unaccent" with schema extensions;

-- `btree_gist` permite constraints de exclusão com colunas escalares
-- (usada para impedir sobreposição de horários na agenda).
create extension if not exists "btree_gist";

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger genérica de atualização de `updated_at`
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Utilitários de busca: `unaccent` imutável (necessário para índices funcionais)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select extensions.unaccent('extensions.unaccent', $1);
$$;

comment on function public.f_unaccent(text) is
  'Normaliza acentos de forma imutável, permitindo índices GIN/GiST funcionais.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Validação de CPF no banco (defesa em profundidade: a mesma regra existe no
-- Value Object de domínio, reutilizado por client e server).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.validar_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_digits text;
  v_sum integer := 0;
  v_digit integer;
  v_weight integer;
  i integer;
begin
  if p_cpf is null then
    return true; -- CPF é opcional em profissionais; pacientes validam em NOT NULL.
  end if;

  v_digits := regexp_replace(p_cpf, '\D', '', 'g');

  if length(v_digits) <> 11 then
    return false;
  end if;

  if v_digits ~ '^(\d)\1{10}$' then
    return false;
  end if;

  for i in 1..9 loop
    v_weight := 11 - i;
    v_sum := v_sum + (substring(v_digits from i for 1)::integer * v_weight);
  end loop;

  v_digit := 11 - (v_sum % 11);
  if v_digit >= 10 then
    v_digit := 0;
  end if;

  if v_digit <> substring(v_digits from 10 for 1)::integer then
    return false;
  end if;

  v_sum := 0;
  for i in 1..10 loop
    v_weight := 12 - i;
    v_sum := v_sum + (substring(v_digits from i for 1)::integer * v_weight);
  end loop;

  v_digit := 11 - (v_sum % 11);
  if v_digit >= 10 then
    v_digit := 0;
  end if;

  return v_digit = substring(v_digits from 11 for 1)::integer;
end;
$$;

comment on function public.validar_cpf(text) is
  'Valida dígitos verificadores do CPF. Espelha o Value Object CPF do domínio.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Normalização de e-mail (mesma regra do Value Object Email)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.normalizar_email(p_email text)
returns text
language sql
immutable
as $$
  select nullif(lower(btrim(p_email)), '');
$$;
