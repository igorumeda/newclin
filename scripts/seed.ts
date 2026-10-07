/**
 * Popula o banco com dados fictícios para testes.
 *
 *   npm run db:seed        (ou npm run db:reset para recriar tudo)
 *
 * ATENÇÃO: nenhum dado aqui é real. Script separado das migrations, que
 * cuidam apenas da estrutura (migrations/*.sql).
 */
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
loadDotenv({ path: '.env.local', override: true });

import { getDatabaseClient } from '../src/server/infrastructure/database/database.factory';
import { loadAppConfig } from '../src/server/config/env.config';
import type { DatabaseClient } from '../src/server/infrastructure/database/database-client.base';
import { PRESETS_TEMA } from '../src/modules/rede/domain/value-objects/tema.vo';
import {
  ALERGIAS_SEED,
  BAIRROS_SEED,
  CONDICOES_SEED,
  CONDUTAS_SEED,
  ESPECIALIDADES_SEED,
  MOTIVOS_CANCELAMENTO,
  NOMES_PACIENTES,
  PROFISSIONAIS_SEED,
  QUEIXAS_SEED,
  REDE_SEED,
  SENHA_PADRAO,
  TIPOS_ATENDIMENTO_SEED,
  UNIDADES_SEED,
} from './seed/dados-ficticios';
import { TEMPLATES_SEED } from './seed/templates-ficticios';

type Contexto = { db: DatabaseClient; redeId: string };
type ReferenciaNomeada = { id: string; nome: string };
type ProfissionalRef = ReferenciaNomeada & { especialidade: string };
type TipoRef = ReferenciaNomeada & { duracaoMinutos: number };

/** Gerador pseudoaleatório determinístico: a mesma seed gera os mesmos dados. */
let semente = 20260101;
function aleatorio(): number {
  semente = (semente * 1103515245 + 12345) % 2147483648;
  return semente / 2147483648;
}
function escolher<T>(itens: T[]): T {
  return itens[Math.floor(aleatorio() * itens.length) % itens.length];
}
function inteiro(min: number, max: number): number {
  return Math.floor(aleatorio() * (max - min + 1)) + min;
}

/** Gera um CPF sintético com dígitos verificadores válidos. */
function gerarCpf(indice: number): string {
  const base = String(10000000000 + indice * 7919).slice(0, 9).split('').map(Number);
  const digito = (numeros: number[]): number => {
    const peso = numeros.length + 1;
    const soma = numeros.reduce((total, valor, posicao) => total + valor * (peso - posicao), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const primeiro = digito(base);
  const segundo = digito([...base, primeiro]);
  return [...base, primeiro, segundo].join('');
}

function telefone(indice: number): string {
  return `119${String(80000000 + indice * 137).slice(0, 8)}`;
}

function dataNascimento(indice: number): string {
  const ano = 1950 + ((indice * 7) % 60);
  const mes = String(((indice * 3) % 12) + 1).padStart(2, '0');
  const dia = String(((indice * 5) % 27) + 1).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function emDias(dias: number, hora: number, minuto = 0): Date {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + dias);
  data.setHours(hora, minuto, 0, 0);
  return data;
}

async function criarRede(db: DatabaseClient): Promise<string> {
  const id = randomUUID();
  const preset = PRESETS_TEMA.find((item) => item.id === REDE_SEED.preset) ?? PRESETS_TEMA[0];
  await db.query({
    sql: `INSERT INTO redes (id, nome, slug, cnpj, tema, config, ativo)
          VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,TRUE)`,
    params: [
      id,
      REDE_SEED.nome,
      REDE_SEED.slug,
      REDE_SEED.cnpj,
      JSON.stringify({ preset: preset.id, cores: preset.cores }),
      JSON.stringify({
        fusoHorario: 'America/Sao_Paulo',
        lembreteWhatsapp: true,
        lembreteEmail: true,
        antecedenciaLembreteHoras: 24,
        confirmacaoAutomatica: false,
      }),
    ],
  });
  return id;
}

async function criarUnidades({ db, redeId }: Contexto): Promise<ReferenciaNomeada[]> {
  const unidades: ReferenciaNomeada[] = [];
  for (const unidade of UNIDADES_SEED) {
    const id = randomUUID();
    await db.query({
      sql: `INSERT INTO unidades
              (id, rede_id, nome, codigo, telefone, email, endereco, fuso_horario, ativo)
            VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,TRUE)`,
      params: [
        id,
        redeId,
        unidade.nome,
        unidade.codigo,
        unidade.telefone,
        unidade.email,
        JSON.stringify({
          logradouro: unidade.logradouro,
          numero: unidade.numero,
          bairro: unidade.bairro,
          cidade: unidade.cidade,
          uf: unidade.uf,
          cep: unidade.cep,
        }),
        unidade.fusoHorario,
      ],
    });
    unidades.push({ id, nome: unidade.nome });
  }
  return unidades;
}

async function criarProfissionais(
  { db, redeId }: Contexto,
  unidades: ReferenciaNomeada[],
): Promise<ProfissionalRef[]> {
  const profissionais: ProfissionalRef[] = [];

  for (let indice = 0; indice < PROFISSIONAIS_SEED.length; indice += 1) {
    const dados = PROFISSIONAIS_SEED[indice];
    const especialidade = ESPECIALIDADES_SEED.find((item) => item.nome === dados.especialidade);
    const id = randomUUID();

    await db.query({
      sql: `INSERT INTO profissionais
              (id, rede_id, nome, cpf, email, telefone, conselho_classe, numero_conselho,
               uf_conselho, especialidade, cor_agenda, ativo)
            VALUES ($1,$2,$3,$4,$5,$6,$7::conselho_classe,$8,$9,$10,$11,TRUE)`,
      params: [
        id,
        redeId,
        dados.nome,
        gerarCpf(500 + indice),
        `${dados.nome.toLowerCase().replace(/[^a-z]+/g, '.')}@saudeviva.com.br`,
        telefone(900 + indice),
        especialidade?.conselho ?? 'CRM',
        dados.numeroConselho,
        'SP',
        dados.especialidade,
        especialidade?.corAgenda ?? '#0ea5e9',
      ],
    });

    const unidadesDoProfissional = unidades.slice(0, indice % 2 === 0 ? 2 : 1);
    for (const unidade of unidadesDoProfissional) {
      await db.query({
        sql: `INSERT INTO profissional_unidades (profissional_id, unidade_id, rede_id, ativo)
              VALUES ($1,$2,$3,TRUE)`,
        params: [id, unidade.id, redeId],
      });

      for (let dia = 1; dia <= 5; dia += 1) {
        await db.query({
          sql: `INSERT INTO horarios_atendimento
                  (rede_id, profissional_id, unidade_id, dia_semana, hora_inicio, hora_fim, ativo)
                VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
          params: [redeId, id, unidade.id, dia, '08:00', '18:00'],
        });
      }
    }

    profissionais.push({ id, nome: dados.nome, especialidade: dados.especialidade });
  }

  return profissionais;
}

async function criarUsuarios(
  { db, redeId }: Contexto,
  unidades: ReferenciaNomeada[],
  profissionais: ProfissionalRef[],
): Promise<void> {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  const usuarios = [
    {
      nome: 'Administrador da Rede',
      email: 'admin@saudeviva.com.br',
      role: 'admin_rede',
      profissionalId: null as string | null,
      unidades: unidades.map((unidade) => unidade.id),
    },
    {
      nome: 'Gestor Unidade Centro',
      email: 'gestor@saudeviva.com.br',
      role: 'gestor_unidade',
      profissionalId: null,
      unidades: [unidades[0].id],
    },
    {
      nome: profissionais[0].nome,
      email: 'medico@saudeviva.com.br',
      role: 'profissional',
      profissionalId: profissionais[0].id,
      unidades: [unidades[0].id, unidades[1].id],
    },
    {
      nome: profissionais[1].nome,
      email: 'pediatra@saudeviva.com.br',
      role: 'profissional',
      profissionalId: profissionais[1].id,
      unidades: [unidades[0].id],
    },
    {
      nome: 'Recepção Centro',
      email: 'recepcao@saudeviva.com.br',
      role: 'recepcao',
      profissionalId: null,
      unidades: [unidades[0].id],
    },
  ];

  for (const usuario of usuarios) {
    const id = randomUUID();
    await db.query({
      sql: `INSERT INTO usuarios (id, rede_id, nome, email, senha_hash, role, profissional_id, ativo)
            VALUES ($1,$2,$3,$4,$5,$6::usuario_role,$7,TRUE)`,
      params: [id, redeId, usuario.nome, usuario.email, senhaHash, usuario.role, usuario.profissionalId],
    });
    for (const unidadeId of usuario.unidades) {
      await db.query({
        sql: 'INSERT INTO usuario_unidades (usuario_id, unidade_id, rede_id) VALUES ($1,$2,$3)',
        params: [id, unidadeId, redeId],
      });
    }
  }
}

async function criarTiposAtendimento({ db, redeId }: Contexto): Promise<TipoRef[]> {
  const tipos: TipoRef[] = [];
  for (const tipo of TIPOS_ATENDIMENTO_SEED) {
    const id = randomUUID();
    await db.query({
      sql: `INSERT INTO tipos_atendimento (id, rede_id, nome, duracao_minutos, cor, ativo)
            VALUES ($1,$2,$3,$4,$5,TRUE)`,
      params: [id, redeId, tipo.nome, tipo.duracaoMinutos, tipo.cor],
    });
    tipos.push({ id, nome: tipo.nome, duracaoMinutos: tipo.duracaoMinutos });
  }
  return tipos;
}

async function criarTemplates({ db, redeId }: Contexto): Promise<Map<string, string>> {
  const porEspecialidade = new Map<string, string>();
  for (const template of TEMPLATES_SEED) {
    const id = randomUUID();
    await db.query({
      sql: `INSERT INTO templates_prontuario
              (id, rede_id, nome, especialidade, descricao, versao, estrutura, padrao, ativo)
            VALUES ($1,$2,$3,$4,$5,1,$6::jsonb,TRUE,TRUE)`,
      params: [
        id,
        redeId,
        template.nome,
        template.especialidade,
        template.descricao,
        JSON.stringify({ secoes: template.secoes }),
      ],
    });
    porEspecialidade.set(template.especialidade, id);
  }
  return porEspecialidade;
}

async function criarPacientes({ db, redeId }: Contexto): Promise<ReferenciaNomeada[]> {
  const pacientes: ReferenciaNomeada[] = [];

  for (let indice = 0; indice < NOMES_PACIENTES.length; indice += 1) {
    const nome = NOMES_PACIENTES[indice];
    const id = randomUUID();
    const sexo = indice % 2 === 0 ? 'feminino' : 'masculino';

    await db.query({
      sql: `INSERT INTO pacientes
              (id, rede_id, nome, cpf, data_nascimento, sexo, telefone, email, endereco,
               responsavel_nome, responsavel_telefone, alergias, condicoes_cronicas, observacoes,
               consentimento_lgpd, consentimento_em, ativo)
            VALUES ($1,$2,$3,$4,$5,$6::paciente_sexo,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,TRUE,now(),TRUE)`,
      params: [
        id,
        redeId,
        nome,
        gerarCpf(indice + 1),
        dataNascimento(indice + 1),
        sexo,
        telefone(indice),
        `${nome.toLowerCase().replace(/[^a-z]+/g, '.')}@exemplo.com.br`,
        JSON.stringify({
          logradouro: 'Rua Fictícia',
          numero: String(100 + indice),
          bairro: escolher(BAIRROS_SEED),
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01000000',
        }),
        indice % 7 === 0 ? 'Responsável Fictício' : null,
        indice % 7 === 0 ? telefone(indice + 300) : null,
        indice % 4 === 0 ? [escolher(ALERGIAS_SEED)] : [],
        indice % 3 === 0 ? [escolher(CONDICOES_SEED)] : [],
        indice % 5 === 0 ? 'Paciente fictício gerado pelo seed.' : null,
      ],
    });

    pacientes.push({ id, nome });
  }

  return pacientes;
}

type AgendaParams = {
  contexto: Contexto;
  unidades: ReferenciaNomeada[];
  profissionais: ProfissionalRef[];
  pacientes: ReferenciaNomeada[];
  tipos: TipoRef[];
  templates: Map<string, string>;
};

type ResultadoAgenda = { agendamentos: number; atendimentos: number; documentos: number };

async function criarAgendaEProntuarios(params: AgendaParams): Promise<ResultadoAgenda> {
  const { contexto, unidades, profissionais, pacientes, tipos, templates } = params;
  const { db, redeId } = contexto;

  let agendamentos = 0;
  let atendimentos = 0;
  let documentos = 0;

  for (let dia = -30; dia <= 14; dia += 1) {
    const data = emDias(dia, 8);
    if (data.getDay() === 0 || data.getDay() === 6) continue;

    const consultasNoDia = inteiro(4, 7);
    for (let posicao = 0; posicao < consultasNoDia; posicao += 1) {
      const profissional = escolher(profissionais);
      const paciente = escolher(pacientes);
      const tipo = escolher(tipos);
      const unidade = escolher(unidades);
      const inicio = emDias(dia, 8 + posicao, posicao % 2 === 0 ? 0 : 30);
      const fim = new Date(inicio.getTime() + tipo.duracaoMinutos * 60_000);
      const encaixe = aleatorio() < 0.08;

      let status = 'agendado';
      if (dia < 0) {
        const sorteio = aleatorio();
        if (sorteio < 0.75) status = 'finalizado';
        else if (sorteio < 0.87) status = 'faltou';
        else status = 'cancelado';
      } else if (dia === 0) {
        status = escolher(['confirmado', 'aguardando', 'em_atendimento', 'finalizado']);
      } else {
        status = aleatorio() < 0.5 ? 'confirmado' : 'agendado';
      }

      const agendamentoId = randomUUID();
      await db.query({
        sql: `INSERT INTO agendamentos
                (id, rede_id, unidade_id, profissional_id, paciente_id, tipo_atendimento_id,
                 data_hora_inicio, data_hora_fim, status, encaixe, observacoes,
                 motivo_cancelamento, origem, checkin_em, ordem_chegada)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::agendamento_status,$10,$11,$12,
                      $13::agendamento_origem,$14,$15)`,
        params: [
          agendamentoId,
          redeId,
          unidade.id,
          profissional.id,
          paciente.id,
          tipo.id,
          inicio,
          fim,
          status,
          encaixe,
          encaixe ? 'Encaixe autorizado pela coordenação' : null,
          status === 'cancelado' ? escolher(MOTIVOS_CANCELAMENTO) : null,
          'recepcao',
          ['aguardando', 'em_atendimento', 'finalizado'].includes(status) ? inicio : null,
          ['aguardando', 'em_atendimento'].includes(status) ? posicao + 1 : null,
        ],
      });
      agendamentos += 1;

      if (status !== 'finalizado') continue;

      const templateId = templates.get(profissional.especialidade) ?? null;
      const atendimentoId = randomUUID();
      await db.query({
        sql: `INSERT INTO atendimentos
                (id, rede_id, unidade_id, agendamento_id, paciente_id, profissional_id,
                 template_id, template_versao, dados_preenchidos, queixa_principal, anamnese,
                 exame_fisico, hipotese_diagnostica, cid10, conduta, fonte_pagadora, status,
                 iniciado_em, finalizado_em)
              VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8::jsonb,$9,$10,$11,$12,$13,$14,
                      $15::fonte_pagadora,'finalizado',$16,$17)`,
        params: [
          atendimentoId,
          redeId,
          unidade.id,
          agendamentoId,
          paciente.id,
          profissional.id,
          templateId,
          JSON.stringify({
            sinais_vitais__pa: `${inteiro(10, 14)}0/${inteiro(6, 9)}0`,
            sinais_vitais__fc: inteiro(58, 96),
            sinais_vitais__temp: 36 + Number(aleatorio().toFixed(1)),
          }),
          escolher(QUEIXAS_SEED),
          'Paciente relata evolução gradual dos sintomas, sem sinais de alarme.',
          'Bom estado geral, hidratado, corado, afebril.',
          'Quadro compatível com a queixa principal; sem complicações.',
          escolher(['J00', 'M54.5', 'I10', 'L30.9', 'F41.1', 'Z00.0']),
          escolher(CONDUTAS_SEED),
          escolher(['publico', 'particular', 'convenio']),
          inicio,
          fim,
        ],
      });
      atendimentos += 1;

      if (aleatorio() < 0.2) {
        await db.query({
          sql: `INSERT INTO adendos (rede_id, atendimento_id, profissional_id, conteudo)
                VALUES ($1,$2,$3,$4)`,
          params: [
            redeId,
            atendimentoId,
            profissional.id,
            'Adendo: resultado de exame recebido após a finalização, sem alteração de conduta.',
          ],
        });
      }

      if (aleatorio() < 0.45) {
        const tipoDocumento = escolher([
          'receita',
          'atestado',
          'solicitacao_exames',
          'declaracao_comparecimento',
        ]);
        const conteudoPorTipo: Record<string, Record<string, unknown>> = {
          receita: {
            medicamentos: ['Dipirona 500mg — 1 comprimido de 6/6h por 3 dias'],
            orientacoes: 'Ingerir bastante líquido e repousar.',
          },
          atestado: { diasAfastamento: inteiro(1, 5), cid10: 'J00' },
          solicitacao_exames: { exames: ['Hemograma completo', 'Glicemia de jejum'] },
          declaracao_comparecimento: { horaChegada: '08:00', horaSaida: '09:00' },
        };

        await db.query({
          sql: `INSERT INTO documentos
                  (rede_id, unidade_id, paciente_id, atendimento_id, profissional_id, tipo,
                   conteudo, status, emitido_em)
                VALUES ($1,$2,$3,$4,$5,$6::documento_tipo,$7::jsonb,'emitido',$8)`,
          params: [
            redeId,
            unidade.id,
            paciente.id,
            atendimentoId,
            profissional.id,
            tipoDocumento,
            JSON.stringify(conteudoPorTipo[tipoDocumento]),
            fim,
          ],
        });
        documentos += 1;
      }
    }
  }

  return { agendamentos, atendimentos, documentos };
}

async function criarBloqueios(
  { db, redeId }: Contexto,
  unidades: ReferenciaNomeada[],
  profissionais: ProfissionalRef[],
): Promise<void> {
  await db.query({
    sql: `INSERT INTO bloqueios_agenda
            (rede_id, unidade_id, profissional_id, motivo, data_hora_inicio, data_hora_fim)
          VALUES ($1,$2,$3,$4,$5,$6)`,
    params: [
      redeId,
      unidades[0].id,
      profissionais[0].id,
      'Férias programadas',
      emDias(7, 0),
      emDias(10, 23, 59),
    ],
  });

  await db.query({
    sql: `INSERT INTO bloqueios_agenda
            (rede_id, unidade_id, profissional_id, motivo, data_hora_inicio, data_hora_fim)
          VALUES ($1,$2,NULL,$3,$4,$5)`,
    params: [
      redeId,
      unidades[1].id,
      'Manutenção predial — unidade fechada',
      emDias(5, 12),
      emDias(5, 18),
    ],
  });
}

async function criarNotificacoes(
  { db, redeId }: Contexto,
  pacientes: ReferenciaNomeada[],
): Promise<void> {
  const agendamento = await db.queryOne<{ id: string; paciente_id: string }>({
    sql: `SELECT id, paciente_id FROM agendamentos
           WHERE rede_id = $1 AND data_hora_inicio > now()
           ORDER BY data_hora_inicio ASC LIMIT 1`,
    params: [redeId],
  });

  await db.query({
    sql: `INSERT INTO notificacoes
            (rede_id, canal, tipo, destinatario, assunto, conteudo, variaveis, status,
             agendada_para, enviada_em, agendamento_id, paciente_id, provider)
          VALUES ($1,'email'::notificacao_canal,'confirmacao_agendamento'::notificacao_tipo,
                  $2,$3,$4,'{}'::jsonb,'enviado'::notificacao_status, now() - INTERVAL '1 day',
                  now() - INTERVAL '1 day', $5, $6, 'log')`,
    params: [
      redeId,
      'ana.clara.souza@exemplo.com.br',
      'Consulta agendada em Unidade Centro',
      'Olá! Sua consulta foi agendada com sucesso.',
      agendamento?.id ?? null,
      agendamento?.paciente_id ?? pacientes[0].id,
    ],
  });

  if (agendamento) {
    await db.query({
      sql: `INSERT INTO notificacoes
              (rede_id, canal, tipo, destinatario, assunto, conteudo, variaveis, status,
               agendada_para, agendamento_id, paciente_id)
            VALUES ($1,'whatsapp'::notificacao_canal,'lembrete_consulta'::notificacao_tipo,
                    $2,$3,$4,'{}'::jsonb,'pendente'::notificacao_status,
                    now() + INTERVAL '2 hours', $5, $6)`,
      params: [
        redeId,
        telefone(1),
        'Lembrete de consulta',
        'Olá! Lembrete da sua consulta. Responda SIM para confirmar ou NAO para cancelar.',
        agendamento.id,
        agendamento.paciente_id,
      ],
    });
  }
}

async function criarAuditoria({ db, redeId }: Contexto): Promise<void> {
  const usuario = await db.queryOne<{ id: string; nome: string }>({
    sql: "SELECT id, nome FROM usuarios WHERE rede_id = $1 AND role = 'admin_rede' LIMIT 1",
    params: [redeId],
  });
  if (!usuario) return;

  await db.query({
    sql: `INSERT INTO auditoria
            (rede_id, usuario_id, usuario_nome, acao, entidade, entidade_id, descricao, ip)
          VALUES ($1,$2,$3,'login'::auditoria_acao,'sessao',NULL,'Login do administrador','127.0.0.1')`,
    params: [redeId, usuario.id, usuario.nome],
  });
}

async function main(): Promise<void> {
  const appConfig = loadAppConfig();
  const db = getDatabaseClient();

  console.log(`→ Semeando dados fictícios (driver ${appConfig.database.driver})`);

  const jaExiste = await db.queryOne<{ total: number }>({
    sql: 'SELECT count(*)::int AS total FROM redes',
  });
  if ((jaExiste?.total ?? 0) > 0) {
    console.log('✔ Banco já possui dados. Use `npm run db:reset` para recriar do zero.');
    await db.close();
    return;
  }

  // Tudo em uma transação: qualquer falha deixa o banco sem lixo parcial.
  const resultado = await db.transaction(async (client) => {
    const redeId = await criarRede(client);
    const contexto: Contexto = { db: client, redeId };

    const unidades = await criarUnidades(contexto);
    const profissionais = await criarProfissionais(contexto, unidades);
    await criarUsuarios(contexto, unidades, profissionais);
    const tipos = await criarTiposAtendimento(contexto);
    const templates = await criarTemplates(contexto);
    const pacientes = await criarPacientes(contexto);
    const resumo = await criarAgendaEProntuarios({
      contexto,
      unidades,
      profissionais,
      pacientes,
      tipos,
      templates,
    });
    await criarBloqueios(contexto, unidades, profissionais);
    await criarNotificacoes(contexto, pacientes);
    await criarAuditoria(contexto);

    return { unidades, profissionais, tipos, templates, pacientes, resumo };
  });

  const { unidades, profissionais, tipos, templates, pacientes, resumo } = resultado;

  console.log('✔ Dados fictícios criados:');
  console.log(`   • 1 rede (${REDE_SEED.nome})`);
  console.log(`   • ${unidades.length} unidades, ${profissionais.length} profissionais`);
  console.log(`   • ${tipos.length} tipos de atendimento, ${templates.size} templates`);
  console.log(`   • ${pacientes.length} pacientes`);
  console.log(
    `   • ${resumo.agendamentos} agendamentos, ${resumo.atendimentos} atendimentos, ${resumo.documentos} documentos`,
  );
  console.log('');
  console.log('   Acessos de teste (senha única):');
  console.log(`   admin@saudeviva.com.br     → Admin da Rede     (${SENHA_PADRAO})`);
  console.log(`   gestor@saudeviva.com.br    → Gestor de Unidade (${SENHA_PADRAO})`);
  console.log(`   medico@saudeviva.com.br    → Médico            (${SENHA_PADRAO})`);
  console.log(`   recepcao@saudeviva.com.br  → Recepção          (${SENHA_PADRAO})`);

  await db.close();
}

main().catch(async (error) => {
  console.error('✖ Falha ao semear o banco:', error);
  process.exitCode = 1;
});
