/** Marcador semântico para DTOs da camada de aplicação. */
export type Dto = Record<string, unknown>;

export type PaginatedInputDto = {
  page?: number;
  perPage?: number;
  search?: string;
};
