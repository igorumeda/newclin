import { z } from 'zod';

const statusSchema = z.enum([
  'agendado',
  'confirmado',
  'aguardando',
  'em_atendimento',
  'finalizado',
  'cancelado',
  'faltou',
]);

const isoDateTime = z
  .string()
  .trim()
  .min(10)
  .refine((valor) => !Number.isNaN(new Date(valor).getTime()), 'Data/hora inválida');

export const listarAgendaRequestSchema = z.object({
  unidadeId: z.string().uuid().optional(),
  profissionalId: z.string().uuid().optional(),
  pacienteId: z.string().uuid().optional(),
  de: isoDateTime,
  ate: isoDateTime,
  status: z
    .union([statusSchema, z.array(statusSchema)])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : Array.isArray(valor) ? valor : [valor])),
  incluirCancelados: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => valor === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(500).default(200),
});

export const criarAgendamentoRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  pacienteId: z.string().uuid(),
  tipoAtendimentoId: z.string().uuid().nullable().optional(),
  inicio: isoDateTime,
  fim: isoDateTime.nullable().optional(),
  duracaoMinutos: z.coerce.number().int().min(5).max(480).nullable().optional(),
  encaixe: z.boolean().optional(),
  encaixeJustificativa: z.string().trim().max(500).nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
  notificarPaciente: z.boolean().optional(),
});

export const atualizarAgendamentoRequestSchema = z.object({
  unidadeId: z.string().uuid().optional(),
  profissionalId: z.string().uuid().optional(),
  inicio: isoDateTime.optional(),
  fim: isoDateTime.nullable().optional(),
  duracaoMinutos: z.coerce.number().int().min(5).max(480).nullable().optional(),
  tipoAtendimentoId: z.string().uuid().nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
  encaixe: z.boolean().optional(),
  encaixeJustificativa: z.string().trim().max(500).nullable().optional(),
});

export const alterarStatusRequestSchema = z.object({
  novoStatus: statusSchema,
  motivo: z.string().trim().max(500).nullable().optional(),
});

export const cancelarAgendamentoRequestSchema = z.object({
  motivo: z.string().trim().min(3).max(500),
});

export const verificarConflitoRequestSchema = z.object({
  profissionalId: z.string().uuid(),
  unidadeId: z.string().uuid(),
  inicio: isoDateTime,
  fim: isoDateTime,
  ignorarAgendamentoId: z.string().uuid().nullable().optional(),
  encaixe: z.boolean().optional(),
});

export const painelRecepcaoRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const horariosDisponiveisRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipoAtendimentoId: z.string().uuid().nullable().optional(),
  incluirPassados: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => valor === 'true'),
});

// ── Tipos de atendimento ────────────────────────────────────────────────────
export const listarTiposAtendimentoRequestSchema = z.object({
  somenteAtivos: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? true : valor === 'true')),
  busca: z.string().trim().max(80).optional(),
});

export const criarTipoAtendimentoRequestSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().trim().max(500).nullable().optional(),
  duracaoMinutos: z.coerce.number().int().min(5).max(480).default(30),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0ea5e9'),
  requerConfirmacao: z.boolean().optional(),
});

export const atualizarTipoAtendimentoRequestSchema = criarTipoAtendimentoRequestSchema.partial();

// ── Bloqueios ───────────────────────────────────────────────────────────────
export const listarBloqueiosRequestSchema = z.object({
  unidadeId: z.string().uuid().optional(),
  profissionalId: z.string().uuid().optional(),
  de: isoDateTime,
  ate: isoDateTime,
  somenteAtivos: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? true : valor === 'true')),
});

export const criarBloqueioRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  tipo: z.enum(['ferias', 'congresso', 'almoco', 'manutencao', 'outro']).optional(),
  motivo: z.string().trim().max(500).nullable().optional(),
  inicio: isoDateTime,
  fim: isoDateTime,
  diaInteiro: z.boolean().optional(),
});
