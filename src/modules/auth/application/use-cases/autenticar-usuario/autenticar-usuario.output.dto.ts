import type { UsuarioOutputDto } from '../../mappers/usuario.output.dto';

export type AutenticarUsuarioOutputDto = {
  token: string;
  expiraEm: string;
  usuario: UsuarioOutputDto;
};
