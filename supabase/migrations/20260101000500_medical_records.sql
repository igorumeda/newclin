-- =============================================================================
-- Clínica SaaS v1.0 — 05 · Prontuário eletrônico, templates e anexos
-- =============================================================================
-- Regras de negócio atendidas (§3.5):
--   - Prontuário vinculado ao paciente (único por rede); cada atendimento é
--     uma entrada do prontuário.
--   - Motor de templates dinâmicos: seções → campos (9 tipos de campo).
--   - Templates configuráveis por especialidade, com padrões do sistema.
--   - Campos fixos: queixa principal, anamnese, exame físico, hipótese
--     diagnóstica (CID) e conduta.
--   - Dados do template em JSON versionado (guarda a versão usada).
--   - Imutabilidade após finalização; correções somente via adendo.
--   - Anexos com limite de 10 MB e tipos PDF/JPG/PNG.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Templates de prontuário
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.templates_prontuario (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  nome text not null,
  especialidade text not null,
  descricao text,
  estrutura jsonb not null default '{"secoes": []}'::jsonb,
  versao integer not null default 1,
  origem text not null default 'proprio',
  template_base_id uuid references public.templates_prontuario (id) on delete set null,
  is_padrao boolean not null default false,
  ativo boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint templates_origem_valida check (origem in ('padrao', 'proprio', 'clonado')),
  constraint templates_versao_valida check (versao >= 1),
  constraint templates_estrutura_valida check (jsonb_typeof(estrutura -> 'secoes') = 'array')
);

comment on column public.templates_prontuario.estrutura is
  'JSON versionado: { secoes: [ { id, titulo, ordem, campos: [ { id, rotulo, tipo, obrigatorio, opcoes, ... } ] } ] }';

create unique index if not exists templates_rede_nome_uidx
  on public.templates_prontuario (rede_id, lower(nome)) where deleted_at is null;

create index if not exists templates_especialidade_idx
  on public.templates_prontuario (rede_id, public.f_unaccent(lower(especialidade)))
  where deleted_at is null and ativo;

drop trigger if exists trg_templates_prontuario_updated_at on public.templates_prontuario;
create trigger trg_templates_prontuario_updated_at before update on public.templates_prontuario
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Atendimentos (entradas do prontuário)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.atendimentos (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  agendamento_id uuid references public.agendamentos (id) on delete set null,
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  profissional_id uuid not null references public.profissionais (id) on delete restrict,
  template_id uuid references public.templates_prontuario (id) on delete set null,
  template_versao integer,
  tipo_atendimento_id uuid references public.tipos_atendimento (id) on delete set null,
  queixa_principal text,
  anamnese text,
  exame_fisico text,
  hipotese_diagnostica text,
  cid text,
  conduta text,
  dados_preenchidos jsonb not null default '{}'::jsonb,
  fonte_pagadora text not null default 'publico',
  status text not null default 'em_andamento',
  iniciado_em timestamptz not null default timezone('utc', now()),
  finalizado_em timestamptz,
  finalizado_por uuid,
  cancelado_em timestamptz,
  motivo_cancelamento text,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint atendimentos_status_valido check (status in ('em_andamento', 'finalizado', 'cancelado')),
  -- Expansível na v2.0 para 'particular' e 'convenio' (§5).
  constraint atendimentos_fonte_pagadora_valida check (fonte_pagadora in ('publico', 'particular', 'convenio')),
  constraint atendimentos_finalizacao_valida check (
    (status = 'finalizado' and finalizado_em is not null) or status <> 'finalizado'
  ),
  constraint atendimentos_cancelamento_motivo check (
    status <> 'cancelado' or motivo_cancelamento is not null
  )
);

comment on table public.atendimentos is
  'Entrada do prontuário (evolução clínica). Imutável após finalização — correções via adendo.';

create index if not exists atendimentos_paciente_idx
  on public.atendimentos (rede_id, paciente_id, iniciado_em desc) where deleted_at is null;
create index if not exists atendimentos_profissional_idx
  on public.atendimentos (rede_id, profissional_id, iniciado_em desc) where deleted_at is null;
create unique index if not exists atendimentos_agendamento_uidx
  on public.atendimentos (agendamento_id) where agendamento_id is not null and deleted_at is null;

drop trigger if exists trg_atendimentos_updated_at on public.atendimentos;
create trigger trg_atendimentos_updated_at before update on public.atendimentos
  for each row execute function public.set_updated_at();

-- Imutabilidade: após finalizado, o atendimento não pode ser alterado nem excluído.
create or replace function public.proteger_atendimento_finalizado()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'finalizado' then
      raise exception 'Atendimento finalizado não pode ser excluído. Registre um adendo.'
        using errcode = '23514';
    end if;
    return old;
  end if;

  if old.status = 'finalizado' then
    raise exception 'Atendimento finalizado é imutável. Registre um adendo para corrigir.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_atendimentos_imutavel on public.atendimentos;
create trigger trg_atendimentos_imutavel before update or delete on public.atendimentos
  for each row execute function public.proteger_atendimento_finalizado();

-- ─────────────────────────────────────────────────────────────────────────────
-- Evoluções e adendos (inserção apenas)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.evolucoes (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  atendimento_id uuid not null references public.atendimentos (id) on delete cascade,
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  profissional_id uuid not null references public.profissionais (id) on delete restrict,
  tipo text not null default 'adendo',
  conteudo text not null,
  dados jsonb not null default '{}'::jsonb,
  assinado_em timestamptz not null default timezone('utc', now()),
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  constraint evolucoes_tipo_valido check (tipo in ('adendo', 'evolucao', 'retificacao'))
);

comment on table public.evolucoes is
  'Entradas complementares do prontuário. Somente inserção: adendos corrigem o atendimento original.';

create index if not exists evolucoes_atendimento_idx on public.evolucoes (atendimento_id, created_at);

create or replace function public.proteger_evolucao()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Adendos são imutáveis: registre uma nova entrada datada.'
    using errcode = '23514';
end;
$$;

drop trigger if exists trg_evolucoes_imutavel on public.evolucoes;
create trigger trg_evolucoes_imutavel before update or delete on public.evolucoes
  for each row execute function public.proteger_evolucao();

-- ─────────────────────────────────────────────────────────────────────────────
-- Anexos (prontuário/atendimento e paciente) — arquivos no Supabase Storage
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.anexos (
  id uuid primary key default extensions.gen_random_uuid(),
  rede_id uuid not null references public.redes (id) on delete cascade,
  paciente_id uuid references public.pacientes (id) on delete cascade,
  atendimento_id uuid references public.atendimentos (id) on delete cascade,
  nome_arquivo text not null,
  descricao text,
  mime_type text not null,
  tamanho_bytes bigint not null,
  storage_bucket text not null default 'anexos',
  storage_path text not null,
  uploaded_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint anexos_vinculo_obrigatorio check (paciente_id is not null or atendimento_id is not null),
  constraint anexos_tamanho_valido check (tamanho_bytes > 0 and tamanho_bytes <= 10485760),
  constraint anexos_mime_valido check (mime_type in ('application/pdf', 'image/jpeg', 'image/png'))
);

create index if not exists anexos_paciente_idx on public.anexos (rede_id, paciente_id) where deleted_at is null;
create index if not exists anexos_atendimento_idx on public.anexos (rede_id, atendimento_id) where deleted_at is null;

drop trigger if exists trg_anexos_updated_at on public.anexos;
create trigger trg_anexos_updated_at before update on public.anexos
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Templates padrão por especialidade (§3.5)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.seed_templates_padrao(p_rede_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_clinica_geral jsonb := '{
    "secoes": [
      {"id":"sinais-vitais","titulo":"Sinais vitais","ordem":1,"campos":[
        {"id":"peso","rotulo":"Peso (kg)","tipo":"numero","obrigatorio":false,"ordem":1,"min":0,"max":400},
        {"id":"altura","rotulo":"Altura (cm)","tipo":"numero","obrigatorio":false,"ordem":2,"min":20,"max":260},
        {"id":"pa","rotulo":"Pressão arterial (mmHg)","tipo":"texto_curto","obrigatorio":false,"ordem":3,"placeholder":"120/80"},
        {"id":"fc","rotulo":"Frequência cardíaca (bpm)","tipo":"numero","obrigatorio":false,"ordem":4,"min":20,"max":250},
        {"id":"temperatura","rotulo":"Temperatura (°C)","tipo":"numero","obrigatorio":false,"ordem":5,"min":30,"max":45},
        {"id":"saturacao","rotulo":"Saturação O₂ (%)","tipo":"numero","obrigatorio":false,"ordem":6,"min":50,"max":100}
      ]},
      {"id":"avaliacao","titulo":"Avaliação complementar","ordem":2,"campos":[
        {"id":"dor","rotulo":"Intensidade da dor","tipo":"escala","obrigatorio":false,"ordem":1,"min":0,"max":10},
        {"id":"comorbidades","rotulo":"Comorbidades","tipo":"selecao_multipla","obrigatorio":false,"ordem":2,"opcoes":["Hipertensão","Diabetes","Dislipidemia","Obesidade","Tabagismo","Asma","Outras"]},
        {"id":"retorno","rotulo":"Retorno em","tipo":"data","obrigatorio":false,"ordem":3}
      ]}
    ]
  }'::jsonb;

  v_pediatria jsonb := '{
    "secoes": [
      {"id":"antropometria","titulo":"Antropometria","ordem":1,"campos":[
        {"id":"peso","rotulo":"Peso (kg)","tipo":"numero","obrigatorio":true,"ordem":1,"min":0,"max":120},
        {"id":"altura","rotulo":"Altura (cm)","tipo":"numero","obrigatorio":true,"ordem":2,"min":20,"max":200},
        {"id":"perimetro-cefalico","rotulo":"Perímetro cefálico (cm)","tipo":"numero","obrigatorio":false,"ordem":3,"min":20,"max":70},
        {"id":"imc","rotulo":"IMC (kg/m²)","tipo":"numero","obrigatorio":false,"ordem":4,"min":5,"max":60}
      ]},
      {"id":"desenvolvimento","titulo":"Desenvolvimento","ordem":2,"campos":[
        {"id":"marcos","rotulo":"Marcos do desenvolvimento presentes","tipo":"selecao_multipla","obrigatorio":false,"ordem":1,"opcoes":["Sustenta a cabeça","Senta sem apoio","Engatinha","Anda com apoio","Anda sozinho","Fala palavras","Fala frases","Controle esfincteriano"]},
        {"id":"alteracoes","rotulo":"Alterações identificadas","tipo":"texto_longo","obrigatorio":false,"ordem":2}
      ]},
      {"id":"alimentacao","titulo":"Alimentação e prevenção","ordem":3,"campos":[
        {"id":"aleitamento","rotulo":"Em aleitamento materno","tipo":"sim_nao","obrigatorio":false,"ordem":1},
        {"id":"tipo-aleitamento","rotulo":"Tipo de aleitamento","tipo":"selecao_unica","obrigatorio":false,"ordem":2,"opcoes":["Exclusivo","Predominante","Misto","Complementado","Não"]},
        {"id":"vacinacao","rotulo":"Situação vacinal","tipo":"selecao_unica","obrigatorio":false,"ordem":3,"opcoes":["Em dia","Atrasada","Não informado"]},
        {"id":"suplementacao","rotulo":"Suplementação","tipo":"texto_curto","obrigatorio":false,"ordem":4}
      ]}
    ]
  }'::jsonb;

  v_ginecologia jsonb := '{
    "secoes": [
      {"id":"historia","titulo":"História ginecológica","ordem":1,"campos":[
        {"id":"menarca","rotulo":"Idade da menarca","tipo":"numero","obrigatorio":false,"ordem":1,"min":6,"max":30},
        {"id":"ciclo","rotulo":"Padrão do ciclo","tipo":"selecao_unica","obrigatorio":false,"ordem":2,"opcoes":["Regular","Irregular","Amenorreia","Menopausa"]},
        {"id":"dum","rotulo":"Data da última menstruação","tipo":"data","obrigatorio":false,"ordem":3},
        {"id":"gestacoes","rotulo":"Gestações (G/P/A)","tipo":"texto_curto","obrigatorio":false,"ordem":4,"placeholder":"G2P1A0"},
        {"id":"contracepcao","rotulo":"Método contraceptivo","tipo":"selecao_unica","obrigatorio":false,"ordem":5,"opcoes":["Nenhum","Oral","Injetável","DIU","Implante","Preservativo","Laqueadura"]}
      ]},
      {"id":"exame","titulo":"Exame ginecológico","ordem":2,"campos":[
        {"id":"exame-especular","rotulo":"Exame especular","tipo":"texto_longo","obrigatorio":false,"ordem":1},
        {"id":"toque","rotulo":"Toque bimanual","tipo":"texto_longo","obrigatorio":false,"ordem":2},
        {"id":"rastreios","rotulo":"Rastreios realizados","tipo":"selecao_multipla","obrigatorio":false,"ordem":3,"opcoes":["Citologia oncótica","Mamografia","USG transvaginal","Densitometria"]}
      ]}
    ]
  }'::jsonb;

  v_ortopedia jsonb := '{
    "secoes": [
      {"id":"dor","titulo":"Dor e função","ordem":1,"campos":[
        {"id":"localizacao","rotulo":"Localização da dor","tipo":"selecao_multipla","obrigatorio":false,"ordem":1,"opcoes":["Cervical","Ombro","Cotovelo","Punho/mão","Coluna torácica","Coluna lombar","Quadril","Joelho","Tornozelo/pé"]},
        {"id":"eva","rotulo":"Escala de dor (EVA)","tipo":"escala","obrigatorio":false,"ordem":2,"min":0,"max":10},
        {"id":"tempo","rotulo":"Tempo de evolução","tipo":"texto_curto","obrigatorio":false,"ordem":3,"placeholder":"3 semanas"},
        {"id":"fator","rotulo":"Fator desencadeante","tipo":"texto_curto","obrigatorio":false,"ordem":4}
      ]},
      {"id":"exame","titulo":"Exame ortopédico","ordem":2,"campos":[
        {"id":"inspecao","rotulo":"Inspeção","tipo":"texto_longo","obrigatorio":false,"ordem":1},
        {"id":"amplitude","rotulo":"Amplitude de movimento (graus)","tipo":"texto_curto","obrigatorio":false,"ordem":2},
        {"id":"forca","rotulo":"Força muscular","tipo":"selecao_unica","obrigatorio":false,"ordem":3,"opcoes":["Grau V","Grau IV","Grau III","Grau II","Grau I","Grau 0"]},
        {"id":"testes","rotulo":"Testes especiais","tipo":"texto_longo","obrigatorio":false,"ordem":4},
        {"id":"imagem","rotulo":"Exames de imagem anexados","tipo":"anexo","obrigatorio":false,"ordem":5}
      ]}
    ]
  }'::jsonb;

  v_dermatologia jsonb := '{
    "secoes": [
      {"id":"lesoes","titulo":"Lesões dermatológicas","ordem":1,"campos":[
        {"id":"localizacao","rotulo":"Localização","tipo":"texto_curto","obrigatorio":false,"ordem":1},
        {"id":"descricao","rotulo":"Descrição das lesões","tipo":"texto_longo","obrigatorio":false,"ordem":2},
        {"id":"fototipo","rotulo":"Fototipo (Fitzpatrick)","tipo":"selecao_unica","obrigatorio":false,"ordem":3,"opcoes":["I","II","III","IV","V","VI"]},
        {"id":"tempo","rotulo":"Tempo de evolução","tipo":"texto_curto","obrigatorio":false,"ordem":4}
      ]},
      {"id":"historico","titulo":"Histórico e tratamento","ordem":2,"campos":[
        {"id":"tratamento-previo","rotulo":"Tratamento prévio","tipo":"sim_nao","obrigatorio":false,"ordem":1},
        {"id":"quais-tratamentos","rotulo":"Quais tratamentos","tipo":"texto_longo","obrigatorio":false,"ordem":2},
        {"id":"foto","rotulo":"Foto da lesão","tipo":"anexo","obrigatorio":false,"ordem":3}
      ]}
    ]
  }'::jsonb;

  v_cardiologia jsonb := '{
    "secoes": [
      {"id":"sinais-vitais","titulo":"Sinais vitais","ordem":1,"campos":[
        {"id":"pa","rotulo":"Pressão arterial (mmHg)","tipo":"texto_curto","obrigatorio":true,"ordem":1,"placeholder":"120/80"},
        {"id":"fc","rotulo":"Frequência cardíaca (bpm)","tipo":"numero","obrigatorio":true,"ordem":2,"min":20,"max":250},
        {"id":"saturacao","rotulo":"Saturação O₂ (%)","tipo":"numero","obrigatorio":false,"ordem":3,"min":50,"max":100},
        {"id":"peso","rotulo":"Peso (kg)","tipo":"numero","obrigatorio":false,"ordem":4,"min":0,"max":400}
      ]},
      {"id":"sintomas","titulo":"Sintomas","ordem":2,"campos":[
        {"id":"sintomas-presentes","rotulo":"Sintomas presentes","tipo":"selecao_multipla","obrigatorio":false,"ordem":1,"opcoes":["Dor torácica","Dispneia","Palpitações","Síncope","Edema","Claudicação","Assintomático"]},
        {"id":"nyha","rotulo":"Classe funcional (NYHA)","tipo":"selecao_unica","obrigatorio":false,"ordem":2,"opcoes":["I","II","III","IV"]},
        {"id":"exame-cardiovascular","rotulo":"Exame cardiovascular","tipo":"texto_longo","obrigatorio":false,"ordem":3},
        {"id":"ecg","rotulo":"ECG realizado","tipo":"sim_nao","obrigatorio":false,"ordem":4}
      ]}
    ]
  }'::jsonb;

  v_psiquiatria jsonb := '{
    "secoes": [
      {"id":"avaliacao-psiquica","titulo":"Avaliação psíquica","ordem":1,"campos":[
        {"id":"humor","rotulo":"Escala de humor (0-10)","tipo":"escala","obrigatorio":false,"ordem":1,"min":0,"max":10},
        {"id":"ansiedade","rotulo":"Escala de ansiedade (0-10)","tipo":"escala","obrigatorio":false,"ordem":2,"min":0,"max":10},
        {"id":"sono","rotulo":"Qualidade do sono","tipo":"selecao_unica","obrigatorio":false,"ordem":3,"opcoes":["Preservado","Insônia inicial","Insônia intermediária","Insônia terminal","Hipersonia"]},
        {"id":"risco","rotulo":"Risco de autoextermínio","tipo":"selecao_unica","obrigatorio":true,"ordem":4,"opcoes":["Ausente","Baixo","Moderado","Alto"]},
        {"id":"ideacao","rotulo":"Ideação suicida ativa","tipo":"sim_nao","obrigatorio":true,"ordem":5}
      ]},
      {"id":"tratamento","titulo":"Tratamento","ordem":2,"campos":[
        {"id":"diagnostico-previo","rotulo":"Diagnóstico prévio","tipo":"texto_curto","obrigatorio":false,"ordem":1},
        {"id":"medicacoes","rotulo":"Medicações em uso","tipo":"texto_longo","obrigatorio":false,"ordem":2},
        {"id":"adesao","rotulo":"Adesão ao tratamento","tipo":"selecao_unica","obrigatorio":false,"ordem":3,"opcoes":["Boa","Parcial","Ruim","Não se aplica"]},
        {"id":"encaminhamento","rotulo":"Encaminhamento","tipo":"texto_longo","obrigatorio":false,"ordem":4}
      ]}
    ]
  }'::jsonb;
begin
  insert into public.templates_prontuario (rede_id, nome, especialidade, descricao, estrutura, origem, is_padrao)
  values
    (p_rede_id, 'Clínica Geral — Padrão', 'Clínica Geral', 'Template padrão para consultas de clínica geral.', v_clinica_geral, 'padrao', true),
    (p_rede_id, 'Pediatria — Padrão', 'Pediatria', 'Template padrão para puericultura e consultas pediátricas.', v_pediatria, 'padrao', true),
    (p_rede_id, 'Ginecologia e Obstetrícia — Padrão', 'Ginecologia e Obstetrícia', 'Template padrão para consultas ginecológicas.', v_ginecologia, 'padrao', true),
    (p_rede_id, 'Ortopedia — Padrão', 'Ortopedia', 'Template padrão para avaliação musculoesquelética.', v_ortopedia, 'padrao', true),
    (p_rede_id, 'Dermatologia — Padrão', 'Dermatologia', 'Template padrão para avaliação dermatológica.', v_dermatologia, 'padrao', true),
    (p_rede_id, 'Cardiologia — Padrão', 'Cardiologia', 'Template padrão para avaliação cardiovascular.', v_cardiologia, 'padrao', true),
    (p_rede_id, 'Psiquiatria — Padrão', 'Psiquiatria', 'Template padrão para avaliação psiquiátrica.', v_psiquiatria, 'padrao', true)
  on conflict do nothing;
end;
$$;

create or replace function public.on_rede_created_seed_templates()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.seed_templates_padrao(new.id);
  return new;
end;
$$;

drop trigger if exists trg_redes_seed_templates on public.redes;
create trigger trg_redes_seed_templates after insert on public.redes
  for each row execute function public.on_rede_created_seed_templates();

grant execute on function public.seed_templates_padrao(uuid) to service_role;
