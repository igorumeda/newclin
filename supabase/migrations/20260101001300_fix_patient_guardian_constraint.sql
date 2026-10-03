-- Responsável é obrigatório para menores, independentemente do consentimento LGPD.
-- Mantém a validação do banco alinhada ao Value Object Responsavel do domínio.
begin;

alter table public.pacientes
  drop constraint if exists pacientes_responsavel_menor;

alter table public.pacientes
  add constraint pacientes_responsavel_menor check (
    data_nascimento <= (current_date - interval '18 years')
    or coalesce(length(btrim(responsavel_nome)), 0) >= 3
  );

commit;
