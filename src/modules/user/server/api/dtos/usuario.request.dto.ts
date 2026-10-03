import { z } from 'zod';
import { ROLE_VALUES } from '../../../domain/value-objects/role.vo';

export const listarUsuariosRequestSchema = z.object({
  busca: z.string().trim().max(120).optional(),
  role: z.enum(ROLE_VALUES as [string, ...string[]]).optional(),
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});

export const criarUsuarioRequestSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo'),
  email: z.string().trim().email('Formato de e-mail inválido'),
  role: z.enum(ROLE_VALUES as [string, ...string[]]),
  telefone: z.string().trim().max(20).nullable().optional(),
  unidadesAcesso: z.array(z.string().uuid()).optional(),
  profissionalId: z.string().uuid().nullable().optional(),
});

export const atualizarUsuarioRequestSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo').optional(),
  telefone: z.string().trim().max(20).nullable().optional(),
  role: z.enum(ROLE_VALUES as [string, ...string[]]).optional(),
  unidadesAcesso: z.array(z.string().uuid()).optional(),
  profissionalId: z.string().uuid().nullable().optional(),
});

export type ListarUsuariosRequestDto = z.infer<typeof listarUsuariosRequestSchema>;
export type CriarUsuarioRequestDto = z.infer<typeof criarUsuarioRequestSchema>;
export type AtualizarUsuarioRequestDto = z.infer<typeof atualizarUsuarioRequestSchema>;
