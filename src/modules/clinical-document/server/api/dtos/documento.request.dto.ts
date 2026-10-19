import { z } from 'zod';

const itemReceitaSchema = z.object({
  medicamento: z.string().trim().min(2).max(200),
  dosagem: z.string().trim().min(1).max(120),
  via: z.string().trim().min(1).max(60),
  frequencia: z.string().trim().min(1).max(120),
  duracao: z.string().trim().max(60).default(''),
  observacoes: z.string().trim().max(240).nullable().optional(),
});

const itemExameSchema = z.object({
  nome: z.string().trim().min(2).max(200),
  observacoes: z.string().trim().max(240).nullable().optional(),
});

export const conteudoDocumentoSchema = z.object({
  itens: z.array(itemReceitaSchema).max(30).optional(),
  orientacoes: z.string().trim().max(2000).nullable().optional(),
  diasAfastamento: z.coerce.number().int().min(0).max(365).nullable().optional(),
  cid: z.string().trim().max(10).nullable().optional(),
  finalidade: z.string().trim().max(240).nullable().optional(),
  exames: z.array(itemExameSchema).max(40).optional(),
  justificativa: z.string().trim().max(2000).nullable().optional(),
  dataComparecimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  horaEntrada: z.string().trim().max(5).nullable().optional(),
  horaSaida: z.string().trim().max(5).nullable().optional(),
  procedimento: z.string().trim().max(200).nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
  textoLivre: z.string().trim().max(4000).nullable().optional(),
});

export const tipoDocumentoSchema = z.enum([
  'receita',
  'atestado',
  'solicitacao_exames',
  'declaracao_comparecimento',
]);

export const criarDocumentoRequestSchema = z.object({
  unidadeId: z.string().uuid(),
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  atendimentoId: z.string().uuid().nullable().optional(),
  tipo: tipoDocumentoSchema,
  conteudo: conteudoDocumentoSchema.optional(),
});

export const atualizarDocumentoRequestSchema = z.object({
  conteudo: conteudoDocumentoSchema,
});

export const emitirDocumentoRequestSchema = z.object({
  notificarPaciente: z.boolean().optional(),
});

export const cancelarDocumentoRequestSchema = z.object({
  motivo: z.string().trim().min(3).max(500),
});

export const listarDocumentosRequestSchema = z.object({
  pacienteId: z.string().uuid().optional(),
  atendimentoId: z.string().uuid().optional(),
  profissionalId: z.string().uuid().optional(),
  unidadeId: z.string().uuid().optional(),
  tipo: tipoDocumentoSchema.optional(),
  status: z
    .string()
    .optional()
    .transform((valor) =>
      valor
        ? valor
            .split(',')
            .filter((item): item is 'rascunho' | 'emitido' | 'cancelado' =>
              ['rascunho', 'emitido', 'cancelado'].includes(item),
            )
        : undefined,
    ),
  de: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const obterLinkDocumentoRequestSchema = z.object({
  expiraEmSegundos: z.coerce.number().int().min(60).max(604800).optional(),
});
