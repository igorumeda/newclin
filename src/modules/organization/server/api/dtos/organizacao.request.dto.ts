import { z } from 'zod';

export const listarUnidadesRequestSchema = z.object({
  busca: z.string().trim().max(120).optional(),
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

const enderecoSchema = z.object({
  cep: z.string().trim().max(9).nullable().optional(),
  logradouro: z.string().trim().max(160).nullable().optional(),
  numero: z.string().trim().max(20).nullable().optional(),
  complemento: z.string().trim().max(80).nullable().optional(),
  bairro: z.string().trim().max(80).nullable().optional(),
  cidade: z.string().trim().max(80).nullable().optional(),
  uf: z.string().trim().length(2).nullable().optional(),
});

const configSchema = z.object({
  agenda: z
    .object({
      intervaloEntreConsultasMinutos: z.coerce.number().int().min(0).max(120).optional(),
      antecedenciaMinimaCancelamentoHoras: z.coerce.number().int().min(0).max(168).optional(),
      permitirEncaixe: z.boolean().optional(),
    })
    .optional(),
  notificacoes: z
    .object({
      lembreteHabilitado: z.boolean().optional(),
      lembreteHorasAntes: z.coerce.number().int().min(1).max(168).optional(),
      confirmacaoAutomatica: z.boolean().optional(),
      fallbackEmail: z.boolean().optional(),
    })
    .optional(),
  lgpd: z.object({ exigirConsentimento: z.boolean().optional() }).optional(),
});

export const atualizarOrganizacaoRequestSchema = z.object({
  nome: z.string().trim().min(3).max(120).optional(),
  razaoSocial: z.string().trim().max(160).nullable().optional(),
  cnpj: z.string().trim().max(18).nullable().optional(),
  slug: z.string().trim().max(60).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  telefone: z.string().trim().max(20).nullable().optional(),
  config: configSchema.optional(),
});

const coresSchema = z.record(z.string().regex(/^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?$/));

export const atualizarTemaRequestSchema = z.object({
  preset: z.string().trim().max(40).optional(),
  coresLight: coresSchema.optional(),
  coresDark: coresSchema.optional(),
});

export const criarUnidadeRequestSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome da unidade').max(120),
  cnes: z.string().trim().max(20).nullable().optional(),
  cnpj: z.string().trim().max(18).nullable().optional(),
  telefone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email('Formato de e-mail inválido').nullable().optional(),
  endereco: enderecoSchema.optional(),
  timezone: z.string().trim().max(60).optional(),
  observacoes: z.string().trim().max(500).nullable().optional(),
});

export const atualizarUnidadeRequestSchema = criarUnidadeRequestSchema.partial();

export type AtualizarOrganizacaoRequestDto = z.infer<typeof atualizarOrganizacaoRequestSchema>;
export type AtualizarTemaRequestDto = z.infer<typeof atualizarTemaRequestSchema>;
export type CriarUnidadeRequestDto = z.infer<typeof criarUnidadeRequestSchema>;
export type AtualizarUnidadeRequestDto = z.infer<typeof atualizarUnidadeRequestSchema>;
