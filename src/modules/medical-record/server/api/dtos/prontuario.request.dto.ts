import { z } from 'zod';

// ── Templates ───────────────────────────────────────────────────────────────
export const campoTemplateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-_]*$/, 'Use letras minúsculas, números e hífen'),
  rotulo: z.string().trim().min(2).max(120),
  tipo: z.enum([
    'texto_curto',
    'texto_longo',
    'numero',
    'data',
    'selecao_unica',
    'selecao_multipla',
    'escala',
    'sim_nao',
    'anexo',
  ]),
  obrigatorio: z.boolean().optional(),
  ordem: z.coerce.number().int().min(0).optional(),
  opcoes: z.array(z.string().trim().min(1).max(120)).optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  placeholder: z.string().trim().max(120).nullable().optional(),
  ajuda: z.string().trim().max(240).nullable().optional(),
});

export const secaoTemplateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9][a-z0-9-_]*$/, 'Use letras minúsculas, números e hífen'),
  titulo: z.string().trim().min(2).max(120),
  ordem: z.coerce.number().int().min(0).optional(),
  descricao: z.string().trim().max(240).nullable().optional(),
  campos: z.array(campoTemplateSchema).min(1).max(80),
});

export const listarTemplatesRequestSchema = z.object({
  especialidade: z.string().trim().max(80).optional(),
  busca: z.string().trim().max(120).optional(),
  somenteAtivos: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? true : valor === 'true')),
});

export const criarTemplateRequestSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  especialidade: z.string().trim().min(3).max(80),
  descricao: z.string().trim().max(240).nullable().optional(),
  secoes: z.array(secaoTemplateSchema).min(1).max(30),
});

export const atualizarTemplateRequestSchema = z.object({
  nome: z.string().trim().min(3).max(120).optional(),
  especialidade: z.string().trim().min(3).max(80).optional(),
  descricao: z.string().trim().max(240).nullable().optional(),
  secoes: z.array(secaoTemplateSchema).min(1).max(30).optional(),
});

export const clonarTemplateRequestSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  especialidade: z.string().trim().min(3).max(80).optional(),
});

export const inativarTemplateRequestSchema = z.object({
  reativar: z.boolean().optional(),
});

// ── Atendimentos ────────────────────────────────────────────────────────────
const camposFixosSchema = z.object({
  queixaPrincipal: z.string().trim().max(8000).nullable().optional(),
  anamnese: z.string().trim().max(20000).nullable().optional(),
  exameFisico: z.string().trim().max(20000).nullable().optional(),
  hipoteseDiagnostica: z.string().trim().max(8000).nullable().optional(),
  cid: z.string().trim().max(10).nullable().optional(),
  conduta: z.string().trim().max(20000).nullable().optional(),
});

const dadosPreenchidosSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string()), z.array(z.number())]),
);

export const iniciarAtendimentoRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  agendamentoId: z.string().uuid().nullable().optional(),
  tipoAtendimentoId: z.string().uuid().nullable().optional(),
  templateId: z.string().uuid().nullable().optional(),
  especialidade: z.string().trim().max(80).nullable().optional(),
  fontePagadora: z.enum(['publico', 'particular', 'convenio']).optional(),
  camposFixos: camposFixosSchema.optional(),
});

export const salvarRascunhoRequestSchema = z.object({
  camposFixos: camposFixosSchema.optional(),
  dadosPreenchidos: dadosPreenchidosSchema.optional(),
  fontePagadora: z.enum(['publico', 'particular', 'convenio']).optional(),
  templateId: z.string().uuid().nullable().optional(),
});

export const cancelarAtendimentoRequestSchema = z.object({
  motivo: z.string().trim().min(3).max(500),
});

export const adicionarAdendoRequestSchema = z.object({
  conteudo: z.string().trim().min(5).max(20000),
  tipo: z.enum(['adendo', 'evolucao', 'retificacao']).optional(),
  dados: dadosPreenchidosSchema.optional(),
});

export const listarAtendimentosRequestSchema = z.object({
  pacienteId: z.string().uuid().optional(),
  profissionalId: z.string().uuid().optional(),
  unidadeId: z.string().uuid().optional(),
  de: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z
    .string()
    .optional()
    .transform((valor) =>
      valor ? valor.split(',').filter((item): item is 'em_andamento' | 'finalizado' | 'cancelado' => ['em_andamento', 'finalizado', 'cancelado'].includes(item)) : undefined,
    ),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Anexos ──────────────────────────────────────────────────────────────────
export const enviarAnexoRequestSchema = z.object({
  pacienteId: z.string().uuid(),
  atendimentoId: z.string().uuid().nullable().optional(),
  nomeArquivo: z.string().trim().min(1).max(200),
  descricao: z.string().trim().max(240).nullable().optional(),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  tamanhoBytes: z.coerce.number().int().min(1).max(10 * 1024 * 1024),
  /** Arquivo em base64 (data URL aceita) — validado também no servidor. */
  conteudoBase64: z.string().min(1),
});

export const listarAnexosRequestSchema = z.object({
  pacienteId: z.string().uuid().optional(),
  atendimentoId: z.string().uuid().optional(),
});

export const obterLinkAnexoRequestSchema = z.object({
  expiraEmSegundos: z.coerce.number().int().min(60).max(3600).optional(),
});
