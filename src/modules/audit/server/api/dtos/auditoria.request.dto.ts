import { z } from 'zod';
import { ACOES_AUDITORIA } from '../../../domain/value-objects/acao-auditoria.vo';

export const listarAuditoriaRequestSchema = z.object({
  entidade: z.string().trim().max(60).optional(),
  acao: z.enum(ACOES_AUDITORIA as [string, ...string[]]).optional(),
  usuarioId: z.string().uuid().optional(),
  registroId: z.string().trim().max(60).optional(),
  dataInicio: z.string().date().optional(),
  dataFim: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});

export type ListarAuditoriaRequestDto = z.infer<typeof listarAuditoriaRequestSchema>;
