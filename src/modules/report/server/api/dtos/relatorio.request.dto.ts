import { z } from 'zod';

const dataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Período padrão: últimos 30 dias quando o cliente não informa. */
function periodoPadrao(): { inicio: string; fim: string } {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - 29 * 24 * 60 * 60 * 1000);

  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export const relatorioRequestSchema = z
  .object({
    inicio: dataSchema.optional(),
    fim: dataSchema.optional(),
    unidadeId: z.string().uuid().optional(),
    profissionalId: z.string().uuid().optional(),
  })
  .transform((valor) => {
    const padrao = periodoPadrao();

    return {
      inicio: valor.inicio ?? padrao.inicio,
      fim: valor.fim ?? padrao.fim,
      unidadeId: valor.unidadeId ?? null,
      profissionalId: valor.profissionalId ?? null,
    };
  });

export const dashboardRequestSchema = z.object({
  unidadeId: z.string().uuid().optional(),
});

/** A distribuição aceita o filtro por dimensão além do período. */
export const relatorioDistribuicaoRequestSchema = z
  .object({
    inicio: dataSchema.optional(),
    fim: dataSchema.optional(),
    unidadeId: z.string().uuid().optional(),
    profissionalId: z.string().uuid().optional(),
    dimensao: z.enum(['tipo', 'especialidade']).optional(),
  })
  .transform((valor) => {
    const padrao = periodoPadrao();

    return {
      inicio: valor.inicio ?? padrao.inicio,
      fim: valor.fim ?? padrao.fim,
      unidadeId: valor.unidadeId ?? null,
      profissionalId: valor.profissionalId ?? null,
      dimensao: valor.dimensao ?? ('tipo' as const),
    };
  });
