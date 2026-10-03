import type { UsuarioDto } from '../../mappers/usuario.mapper';

export type CriarUsuarioOutputDto = {
  usuario: UsuarioDto;
  conviteEnviado: boolean;
};
