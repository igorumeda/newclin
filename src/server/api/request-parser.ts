/** Utilidades de leitura do `HttpRequest` usadas pelos controllers. */
import type { HttpQuery } from './http.types';

export type CorpoRequisicao = Record<string, unknown>;
export type LerTextoParams = { query: HttpQuery; chave: string };
export type LerNumeroParams = { query: HttpQuery; chave: string; padrao?: number };
export type LerBooleanoParams = { query: HttpQuery; chave: string; padrao?: boolean };
export type LerListaParams = { query: HttpQuery; chave: string };

export function corpo(body: unknown): CorpoRequisicao {
  return body && typeof body === 'object' ? (body as CorpoRequisicao) : {};
}

export function textoQuery({ query, chave }: LerTextoParams): string | null {
  const valor = query[chave];
  return valor === undefined || valor === '' ? null : valor;
}

export function numeroQuery({ query, chave, padrao }: LerNumeroParams): number | undefined {
  const valor = Number(query[chave]);
  return Number.isFinite(valor) && query[chave] !== undefined && query[chave] !== ''
    ? valor
    : padrao;
}

export function booleanoQuery({ query, chave, padrao }: LerBooleanoParams): boolean | undefined {
  const valor = query[chave];
  if (valor === undefined || valor === '') return padrao;
  return ['1', 'true', 'sim', 'on'].includes(valor.toLowerCase());
}

export function listaQuery({ query, chave }: LerListaParams): string[] | null {
  const valor = query[chave];
  if (!valor) return null;
  const itens = valor
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return itens.length > 0 ? itens : null;
}
