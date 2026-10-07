export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;

export type PaginationParams = { page?: number; perPage?: number };
export type PaginationMeta = { page: number; perPage: number; total: number; totalPages: number };
export type PaginatedResult<T> = { items: T[]; meta: PaginationMeta };
export type BuildPaginationParams = { page?: number; perPage?: number };
export type NormalizedPagination = { page: number; perPage: number; offset: number };
export type BuildPaginatedResultParams<T> = {
  items: T[];
  total: number;
  pagination: NormalizedPagination;
};

export function normalizePagination(params: BuildPaginationParams): NormalizedPagination {
  const page = Math.max(1, Math.floor(params.page ?? DEFAULT_PAGE));
  const requested = Math.floor(params.perPage ?? DEFAULT_PER_PAGE);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, requested));
  return { page, perPage, offset: (page - 1) * perPage };
}

export function buildPaginatedResult<T>(params: BuildPaginatedResultParams<T>): PaginatedResult<T> {
  const { items, total, pagination } = params;
  return {
    items,
    meta: {
      page: pagination.page,
      perPage: pagination.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.perPage)),
    },
  };
}
