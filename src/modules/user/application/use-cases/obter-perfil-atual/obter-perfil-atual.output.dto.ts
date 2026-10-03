import type { UsuarioDto } from '../../mappers/usuario.mapper';

export type ObterPerfilAtualOutputDto = {
  usuario: UsuarioDto;
  permissoes: string[];
};
