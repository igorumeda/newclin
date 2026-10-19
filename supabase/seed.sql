-- =============================================================================
-- Clínica SaaS v1.0 — Dados de demonstração (apenas ambiente local)
-- =============================================================================
-- Executado por `supabase db reset`. Cria uma rede completa com unidades,
-- profissionais, pacientes, agenda e usuários para os quatro papéis.
--
-- Credenciais dos usuários de demonstração (senha: ChangeMe!2026):
--   admin@clinica.exemplo.com     → Admin da Rede
--   gestor@clinica.exemplo.com    → Gestor de Unidade
--   medico@clinica.exemplo.com    → Médico/Profissional
--   recepcao@clinica.exemplo.com  → Recepção
-- =============================================================================

do $$
declare
  v_rede_id uuid := '11111111-1111-4111-8111-111111111111';
  v_unidade_a uuid := '22222222-2222-4222-8222-222222222221';
  v_unidade_b uuid := '22222222-2222-4222-8222-222222222222';
  v_prof_1 uuid := '33333333-3333-4333-8333-333333333331';
  v_prof_2 uuid := '33333333-3333-4333-8333-333333333332';
  v_prof_3 uuid := '33333333-3333-4333-8333-333333333333';
  v_pac_1 uuid := '44444444-4444-4444-8444-444444444441';
  v_pac_2 uuid := '44444444-4444-4444-8444-444444444442';
  v_pac_3 uuid := '44444444-4444-4444-8444-444444444443';
  v_pac_4 uuid := '44444444-4444-4444-8444-444444444444';
  v_pac_5 uuid := '44444444-4444-4444-8444-444444444445';
  v_tipo_consulta uuid;
  v_tipo_retorno uuid;
  v_senha text := extensions.crypt('ChangeMe!2026', extensions.gen_salt('bf'));
  v_identidades_id_gerado boolean;
begin
  -- ── Rede ──────────────────────────────────────────────────────────────────
  insert into public.redes (id, nome, razao_social, cnpj, slug, email, telefone, config)
  values (
    v_rede_id,
    'Rede Saúde Demo',
    'Rede Saúde Demonstração Ltda.',
    '12345678000199',
    'rede-saude-demo',
    'contato@redesaude.exemplo.com',
    '11999990000',
    jsonb_build_object(
      'agenda', jsonb_build_object(
        'intervalo_entre_consultas_minutos', 0,
        'antecedencia_minima_cancelamento_horas', 2,
        'permitir_encaixe', true
      ),
      'notificacoes', jsonb_build_object(
        'lembrete_habilitado', true,
        'lembrete_horas_antes', 24,
        'confirmacao_automatica', true,
        'fallback_email', true
      ),
      'lgpd', jsonb_build_object('exigir_consentimento', true)
    )
  )
  on conflict (id) do nothing;

  -- ── Unidades ──────────────────────────────────────────────────────────────
  insert into public.unidades (id, rede_id, nome, cnes, telefone, email, cep, logradouro, numero, bairro, cidade, uf, timezone)
  values
    (v_unidade_a, v_rede_id, 'Unidade Centro', '1234567', '1133334444', 'centro@redesaude.exemplo.com', '01001000', 'Praça da Sé', '100', 'Sé', 'São Paulo', 'SP', 'America/Sao_Paulo'),
    (v_unidade_b, v_rede_id, 'Unidade Zona Sul', '7654321', '1155556666', 'zonasul@redesaude.exemplo.com', '04538133', 'Avenida Brigadeiro Faria Lima', '2000', 'Itaim Bibi', 'São Paulo', 'SP', 'America/Sao_Paulo')
  on conflict (id) do nothing;

  -- ── Profissionais ─────────────────────────────────────────────────────────
  insert into public.profissionais (id, rede_id, nome, conselho_classe, numero_conselho, uf_conselho, especialidade, telefone, email, cor_agenda)
  values
    (v_prof_1, v_rede_id, 'Dra. Ana Ribeiro', 'CRM', '123456', 'SP', 'Clínica Geral', '11988887777', 'ana.ribeiro@redesaude.exemplo.com', '#0ea5e9'),
    (v_prof_2, v_rede_id, 'Dr. Bruno Carvalho', 'CRM', '654321', 'SP', 'Cardiologia', '11988886666', 'bruno.carvalho@redesaude.exemplo.com', '#8b5cf6'),
    (v_prof_3, v_rede_id, 'Dra. Camila Nunes', 'CRM', '789123', 'SP', 'Pediatria', '11988885555', 'camila.nunes@redesaude.exemplo.com', '#22c55e')
  on conflict (id) do nothing;

  insert into public.profissional_unidades (rede_id, profissional_id, unidade_id)
  values
    (v_rede_id, v_prof_1, v_unidade_a),
    (v_rede_id, v_prof_1, v_unidade_b),
    (v_rede_id, v_prof_2, v_unidade_a),
    (v_rede_id, v_prof_3, v_unidade_b)
  on conflict (profissional_id, unidade_id) do nothing;

  -- Horários de atendimento (segunda a sexta)
  insert into public.horarios_atendimento (rede_id, profissional_id, unidade_id, dia_semana, hora_inicio, hora_fim, duracao_slot_minutos)
  select v_rede_id, v_prof_1, v_unidade_a, d, '08:00', '12:00', 30 from generate_series(1, 5) as d;
  insert into public.horarios_atendimento (rede_id, profissional_id, unidade_id, dia_semana, hora_inicio, hora_fim, duracao_slot_minutos)
  select v_rede_id, v_prof_2, v_unidade_a, d, '13:00', '18:00', 40 from generate_series(1, 5) as d;
  insert into public.horarios_atendimento (rede_id, profissional_id, unidade_id, dia_semana, hora_inicio, hora_fim, duracao_slot_minutos)
  select v_rede_id, v_prof_3, v_unidade_b, d, '08:00', '12:00', 30 from generate_series(1, 5) as d;

  -- ── Tipos de atendimento (criados automaticamente; ajusta cores/durações) ─
  select id into v_tipo_consulta from public.tipos_atendimento where rede_id = v_rede_id and nome = 'Consulta';
  select id into v_tipo_retorno from public.tipos_atendimento where rede_id = v_rede_id and nome = 'Retorno';

  -- ── Pacientes ─────────────────────────────────────────────────────────────
  insert into public.pacientes (
    id, rede_id, nome, cpf, data_nascimento, sexo, telefone, email,
    cep, logradouro, numero, bairro, cidade, uf,
    responsavel_nome, responsavel_telefone,
    alergias, condicoes_cronicas, consentimento_lgpd, consentimento_lgpd_em, consentimento_lgpd_origem
  )
  values
    (v_pac_1, v_rede_id, 'Mariana Alves de Souza', '52998224725', '1985-03-12', 'feminino', '11977771111', 'mariana.souza@exemplo.com',
     '01310100', 'Avenida Paulista', '1500', 'Bela Vista', 'São Paulo', 'SP', null, null,
     'Dipirona', 'Hipertensão arterial', true, timezone('utc', now()), 'recepcao'),
    (v_pac_2, v_rede_id, 'João Pedro Martins', '11144477735', '1978-11-02', 'masculino', '11977772222', 'joao.martins@exemplo.com',
     '04094050', 'Rua Sena Madureira', '800', 'Vila Clementino', 'São Paulo', 'SP', null, null,
     null, 'Diabetes mellitus tipo 2', true, timezone('utc', now()), 'recepcao'),
    (v_pac_3, v_rede_id, 'Helena Martins', '39053344705', '2018-06-20', 'feminino', '11977772222', null,
     '04094050', 'Rua Sena Madureira', '800', 'Vila Clementino', 'São Paulo', 'SP',
     'João Pedro Martins', '11977772222', null, null, true, timezone('utc', now()), 'recepcao'),
    (v_pac_4, v_rede_id, 'Rafael Lima Barros', '54499096081', '1992-01-30', 'masculino', '11977773333', 'rafael.barros@exemplo.com',
     '03047000', 'Rua do Oratório', '120', 'Mooca', 'São Paulo', 'SP', null, null,
     'Penicilina', 'Asma', true, timezone('utc', now()), 'recepcao'),
    (v_pac_5, v_rede_id, 'Clara Ferreira Dias', '12345678909', '2001-09-15', 'feminino', '11977774444', 'clara.dias@exemplo.com',
     '05407001', 'Rua Cardeal Arcoverde', '2000', 'Pinheiros', 'São Paulo', 'SP', null, null,
     null, null, false, null, null)
  on conflict (id) do nothing;

  -- ── Agenda: consultas de hoje e de amanhã ─────────────────────────────────
  insert into public.agendamentos (
    rede_id, unidade_id, profissional_id, paciente_id, tipo_atendimento_id,
    data_hora_inicio, data_hora_fim, status, observacoes, check_in_em
  )
  values
    (v_rede_id, v_unidade_a, v_prof_1, v_pac_1, v_tipo_consulta,
     date_trunc('day', timezone('utc', now())) + interval '13 hours',
     date_trunc('day', timezone('utc', now())) + interval '13 hours 30 minutes',
     'aguardando', 'Paciente relatou dor de cabeça persistente.', timezone('utc', now()) - interval '15 minutes'),
    (v_rede_id, v_unidade_a, v_prof_1, v_pac_2, v_tipo_retorno,
     date_trunc('day', timezone('utc', now())) + interval '14 hours',
     date_trunc('day', timezone('utc', now())) + interval '14 hours 30 minutes',
     'confirmado', null, null),
    (v_rede_id, v_unidade_a, v_prof_2, v_pac_4, v_tipo_consulta,
     date_trunc('day', timezone('utc', now())) + interval '15 hours',
     date_trunc('day', timezone('utc', now())) + interval '15 hours 40 minutes',
     'agendado', null, null),
    (v_rede_id, v_unidade_b, v_prof_3, v_pac_3, v_tipo_consulta,
     date_trunc('day', timezone('utc', now())) + interval '1 day 12 hours',
     date_trunc('day', timezone('utc', now())) + interval '1 day 12 hours 30 minutes',
     'agendado', 'Consulta de puericultura.', null),
    (v_rede_id, v_unidade_a, v_prof_1, v_pac_5, v_tipo_consulta,
     date_trunc('day', timezone('utc', now())) + interval '1 day 13 hours',
     date_trunc('day', timezone('utc', now())) + interval '1 day 13 hours 30 minutes',
     'agendado', null, null);

  -- ── Atendimento finalizado de exemplo (prontuário) ────────────────────────
  declare
    v_agendamento uuid;
    v_template uuid;
  begin
    select id into v_agendamento
      from public.agendamentos
     where rede_id = v_rede_id and paciente_id = v_pac_2
     limit 1;

    select id into v_template
      from public.templates_prontuario
     where rede_id = v_rede_id and especialidade = 'Clínica Geral'
     limit 1;

    insert into public.atendimentos (
      rede_id, unidade_id, agendamento_id, paciente_id, profissional_id, template_id, template_versao,
      queixa_principal, anamnese, exame_fisico, hipotese_diagnostica, cid, conduta,
      dados_preenchidos, fonte_pagadora, status, iniciado_em, finalizado_em
    )
    values (
      v_rede_id, v_unidade_a, v_agendamento, v_pac_2, v_prof_1, v_template, 1,
      'Retorno para controle de diabetes.',
      'Paciente refere boa adesão à dieta e uso regular de metformina. Nega sintomas.',
      'Bom estado geral, corado, hidratado. PA 128/82 mmHg, FC 76 bpm, peso 84 kg.',
      'Diabetes mellitus tipo 2 em controle.',
      'E11.9',
      'Manter metformina 850 mg 2x/dia. Solicitar HbA1c e glicemia de jejum. Retorno em 90 dias.',
      jsonb_build_object('peso', 84, 'altura', 176, 'pa', '128/82', 'fc', 76, 'dor', 0),
      'publico', 'finalizado',
      timezone('utc', now()) - interval '20 days',
      timezone('utc', now()) - interval '20 days' + interval '35 minutes'
    );

    insert into public.evolucoes (rede_id, atendimento_id, paciente_id, profissional_id, tipo, conteudo)
    select v_rede_id, a.id, a.paciente_id, a.profissional_id, 'adendo',
           'Adendo: resultado de HbA1c = 6,8% — controle adequado, mantida conduta.'
      from public.atendimentos a
     where a.rede_id = v_rede_id and a.paciente_id = v_pac_2;
  end;

  -- ── Usuários (auth.users + profiles) ──────────────────────────────────────
  -- O Auth espera strings vazias nos tokens sem valor; NULL pode impedir o login.
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  values
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@clinica.exemplo.com', v_senha, timezone('utc', now()),
     '{"provider":"email","providers":["email"]}',
     jsonb_build_object('rede_id', v_rede_id, 'role', 'admin_rede', 'nome', 'Administrador da Rede', 'unidades_acesso', '[]'::jsonb)::jsonb,
     timezone('utc', now()), timezone('utc', now()), '', '', '', '', '', '', '', ''),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'gestor@clinica.exemplo.com', v_senha, timezone('utc', now()),
     '{"provider":"email","providers":["email"]}',
     jsonb_build_object('rede_id', v_rede_id, 'role', 'gestor_unidade', 'nome', 'Gestora Unidade Centro', 'unidades_acesso', jsonb_build_array(v_unidade_a))::jsonb,
     timezone('utc', now()), timezone('utc', now()), '', '', '', '', '', '', '', ''),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'medico@clinica.exemplo.com', v_senha, timezone('utc', now()),
     '{"provider":"email","providers":["email"]}',
     jsonb_build_object('rede_id', v_rede_id, 'role', 'profissional', 'nome', 'Dra. Ana Ribeiro', 'profissional_id', v_prof_1, 'unidades_acesso', jsonb_build_array(v_unidade_a, v_unidade_b))::jsonb,
     timezone('utc', now()), timezone('utc', now()), '', '', '', '', '', '', '', ''),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'recepcao@clinica.exemplo.com', v_senha, timezone('utc', now()),
     '{"provider":"email","providers":["email"]}',
     jsonb_build_object('rede_id', v_rede_id, 'role', 'recepcao', 'nome', 'Recepção Centro', 'unidades_acesso', jsonb_build_array(v_unidade_a))::jsonb,
     timezone('utc', now()), timezone('utc', now()), '', '', '', '', '', '', '', '')
  on conflict (id) do nothing;

  -- `auth.identities.id` é coluna gerada nas versões recentes do GoTrue e
  -- coluna comum com default nas antigas: a inserção é montada conforme o
  -- catálogo para funcionar em qualquer versão do stack local.
  select (is_identity = 'YES' or is_generated <> 'NEVER')
    into v_identidades_id_gerado
    from information_schema.columns
   where table_schema = 'auth' and table_name = 'identities' and column_name = 'id';

  if coalesce(v_identidades_id_gerado, false) then
    insert into auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    select u.id,
           jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
           'email', u.id::text, timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
      from auth.users u
     where u.id in (
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
     )
    on conflict do nothing;
  else
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    select extensions.gen_random_uuid(), u.id,
           jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
           'email', u.id::text, timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
      from auth.users u
     where u.id in (
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
     )
    on conflict do nothing;
  end if;
end;
$$;
