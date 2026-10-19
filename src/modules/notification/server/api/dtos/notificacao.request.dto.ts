import { z } from 'zod';

const canalSchema = z.enum(['email', 'whatsapp']);
const tipoSchema = z.enum(['confirmacao', 'lembrete', 'documento', 'cancelamento']);
const statusSchema = z.enum([
  'pendente',
  'enviado',
  'entregue',
  'lido',
  'respondido',
  'falha',
  'cancelado',
]);

export const listarNotificacoesRequestSchema = z.object({
  agendamentoId: z.string().uuid().optional(),
  pacienteId: z.string().uuid().optional(),
  canal: canalSchema.optional(),
  tipo: tipoSchema.optional(),
  status: statusSchema.optional(),
  de: z.string().trim().optional(),
  ate: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const salvarModeloMensagemRequestSchema = z.object({
  canal: canalSchema,
  tipo: tipoSchema,
  assunto: z.string().trim().max(200).nullable().optional(),
  corpo: z.string().trim().min(5).max(4000),
  ativo: z.boolean().optional(),
});

export const processarFilaRequestSchema = z.object({
  limite: z.coerce.number().int().min(1).max(200).optional(),
  notificacaoIds: z.array(z.string().uuid()).max(200).optional(),
});

export const enfileirarLembretesRequestSchema = z.object({
  horasAntecedencia: z.coerce.number().int().min(1).max(168).optional(),
  limite: z.coerce.number().int().min(1).max(500).optional(),
});

export type ListarNotificacoesRequestDto = z.infer<typeof listarNotificacoesRequestSchema>;
export type SalvarModeloMensagemRequestDto = z.infer<typeof salvarModeloMensagemRequestSchema>;
export type ProcessarFilaRequestDto = z.infer<typeof processarFilaRequestSchema>;
export type EnfileirarLembretesRequestDto = z.infer<typeof enfileirarLembretesRequestSchema>;
