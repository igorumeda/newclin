import { z } from 'zod';
import { CONSELHOS_CLASSE } from '../../../domain/value-objects/registro-conselho.vo';

export const listarProfissionaisRequestSchema = z.object({
  busca: z.string().trim().max(120).optional(),
  especialidade: z.string().trim().max(80).optional(),
  unidadeId: z.string().uuid().optional(),
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  incluirHorarios: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const profissionalBaseSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome do profissional').max(120),
  conselhoClasse: z.enum(CONSELHOS_CLASSE as [string, ...string[]]),
  numeroConselho: z.string().trim().min(3).max(20),
  ufConselho: z.string().trim().length(2).nullable().optional(),
  cpf: z.string().trim().max(14).nullable().optional(),
  especialidade: z.string().trim().max(80).nullable().optional(),
  registroEspecialista: z.string().trim().max(40).nullable().optional(),
  telefone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email('Formato de e-mail inválido').nullable().optional(),
  corAgenda: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  observacoes: z.string().trim().max(1000).nullable().optional(),
});

export const criarProfissionalRequestSchema = profissionalBaseSchema.extend({
  unidades: z.array(z.string().uuid()).optional(),
});

export const atualizarProfissionalRequestSchema = profissionalBaseSchema.partial();

export const definirHorariosRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  horarios: z
    .array(
      z.object({
        diaSemana: z.coerce.number().int().min(0).max(6),
        horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        horaFim: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        duracaoSlotMinutos: z.coerce.number().int().min(5).max(480).optional(),
        intervaloMinutos: z.coerce.number().int().min(0).max(120).optional(),
      }),
    )
    .max(40),
});

export const definirUnidadesProfissionalRequestSchema = z.object({
  unidadeIds: z.array(z.string().uuid()),
});

export type ListarProfissionaisRequestDto = z.infer<typeof listarProfissionaisRequestSchema>;
export type CriarProfissionalRequestDto = z.infer<typeof criarProfissionalRequestSchema>;
export type AtualizarProfissionalRequestDto = z.infer<typeof atualizarProfissionalRequestSchema>;
export type DefinirHorariosRequestDto = z.infer<typeof definirHorariosRequestSchema>;
