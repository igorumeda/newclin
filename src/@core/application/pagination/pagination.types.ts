export type PaginationParams = {
  page: number;
  perPage: number;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SortDirection = 'asc' | 'desc';

export type SortParams = {
  field: string;
  direction: SortDirection;
};

export const DEFAULT_PAGINATION: PaginationParams = { page: 1, perPage: 20 };
export const MAX_PER_PAGE = 100;
