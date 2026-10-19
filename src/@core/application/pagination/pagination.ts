import { DEFAULT_PAGINATION, MAX_PER_PAGE } from './pagination.types';
import type { PaginationMeta, PaginationParams } from './pagination.types';

export type NormalizePaginationParams = Partial<PaginationParams>;

export function normalizePagination(params: NormalizePaginationParams): PaginationParams {
  const page = Number.isFinite(params.page) && (params.page as number) > 0 ? (params.page as number) : DEFAULT_PAGINATION.page;
  const requestedPerPage =
    Number.isFinite(params.perPage) && (params.perPage as number) > 0
      ? (params.perPage as number)
      : DEFAULT_PAGINATION.perPage;

  return { page: Math.floor(page), perPage: Math.min(Math.floor(requestedPerPage), MAX_PER_PAGE) };
}

export type BuildPaginationMetaParams = {
  pagination: PaginationParams;
  total: number;
};

export function buildPaginationMeta(params: BuildPaginationMetaParams): PaginationMeta {
  const { pagination, total } = params;
  const totalPages = pagination.perPage > 0 ? Math.ceil(total / pagination.perPage) : 0;

  return {
    page: pagination.page,
    perPage: pagination.perPage,
    total,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  };
}

export type PaginatedResult<Item> = {
  items: Item[];
  meta: PaginationMeta;
};

export function toPaginationRange(pagination: PaginationParams): { from: number; to: number } {
  const from = (pagination.page - 1) * pagination.perPage;
  return { from, to: from + pagination.perPage - 1 };
}
