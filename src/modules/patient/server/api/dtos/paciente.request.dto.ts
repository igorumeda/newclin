import { z } from 'zod';

const enderecoSchema = z.object({
  cep: z.string().trim().max(9).nullable().optional(),
  logradouro: z.string().trim().max(150).nullable().optional(),
  numero: z.string().trim().max(20).nullable().optional(),
  complemento: z.string().trim().max(80).nullable().optional(),
  bairro: z.string().trim().max(80).nullable().optional(),
  cidade: z.string().trim().max(80).nullable().optional(),
  uf: z.string().trim().length(2).nullable().optional(),
});

const responsavelFields = {
  responsavelNome: z.string().trim().max(150).nullable().optional(),
  responsavelCpf: z.string().trim().max(14).nullable().optional(),
  responsavelTelefone: z.string().trim().max(20).nullable().optional(),
  responsavelParentesco: z.string().trim().max(20).nullable().optional(),
};

export const listarPacientesRequestSchema = z.object({
  termo: z.string().trim().max(120).optional(),
  unidadeId: z.string().uuid().optional(),
  somenteAtivos: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? true : valor === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const criarPacienteRequestSchema = z.object({
  nome: z.string().trim().min(3).max(150),
  cpf: z.string().trim().min(11).max(14),
  dataNascimento: z.string().trim().min(8).max(10),
  sexo: z.enum(['feminino', 'masculino', 'outro', 'nao_informado']),
  telefone: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().max(150).nullable().optional(),
  endereco: enderecoSchema.optional(),
  ...responsavelFields,
  alergias: z.string().trim().max(2000).nullable().optional(),
  condicoesCronicas: z.string().trim().max(2000).nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
  consentimentoLgpd: z.boolean().optional(),
  ignorarDuplicidade: z.boolean().optional(),
});

export const atualizarPacienteRequestSchema = criarPacienteRequestSchema.partial();

export const verificarDuplicidadeRequestSchema = z.object({
  cpf: z.string().trim().max(14).nullable().optional(),
  nome: z.string().trim().max(150).nullable().optional(),
  dataNascimento: z.string().trim().max(10).nullable().optional(),
  ignorarId: z.string().uuid().nullable().optional(),
});

const linhaImportacaoSchema = z.object({
  linha: z.coerce.number().int().min(1),
  nome: z.string().trim().max(150).optional(),
  cpf: z.string().trim().max(14).optional(),
  dataNascimento: z.string().trim().max(10).optional(),
  sexo: z.string().trim().max(20).optional(),
  telefone: z.string().trim().max(20).optional(),
  email: z.string().trim().max(150).optional(),
  cep: z.string().trim().max(9).optional(),
  logradouro: z.string().trim().max(150).optional(),
  numero: z.string().trim().max(20).optional(),
  complemento: z.string().trim().max(80).optional(),
  bairro: z.string().trim().max(80).optional(),
  cidade: z.string().trim().max(80).optional(),
  uf: z.string().trim().max(2).optional(),
  responsavelNome: z.string().trim().max(150).optional(),
  responsavelTelefone: z.string().trim().max(20).optional(),
  responsavelParentesco: z.string().trim().max(20).optional(),
  alergias: z.string().trim().max(2000).optional(),
  condicoesCronicas: z.string().trim().max(2000).optional(),
  observacoes: z.string().trim().max(2000).optional(),
});

/** Limite por requisição: a planilha é fatiada no client em lotes de 500 linhas. */
export const importarPacientesRequestSchema = z.object({
  linhas: z.array(linhaImportacaoSchema).min(1).max(500),
  consentimentoLgpd: z.boolean().optional(),
});
