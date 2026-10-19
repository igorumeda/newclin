import type { PaginationMeta } from '@core/application/pagination/pagination.types';
import type { AuditoriaDto } from '../../mappers/auditoria.mapper';

export type ListarAuditoriaOutputDto = {
  items: AuditoriaDto[];
  meta: PaginationMeta;
};
