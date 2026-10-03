import type { PaginationMeta } from '@core/application/pagination/pagination.types';
import type { UsuarioDto } from '../../mappers/usuario.mapper';

export type ListarUsuariosOutputDto = {
  items: UsuarioDto[];
  meta: PaginationMeta;
};
