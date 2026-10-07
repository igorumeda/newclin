import { NotFoundError } from '@core/domain/errors/not-found.error';

export type UsuarioNaoEncontradoErrorParams = { usuarioId: string };

export class UsuarioNaoEncontradoError extends NotFoundError {
  constructor(params: UsuarioNaoEncontradoErrorParams) {
    super({
      message: `Usuário "${params.usuarioId}" não encontrado`,
      code: 'USUARIO_NAO_ENCONTRADO',
    });
    this.name = 'UsuarioNaoEncontradoError';
  }
}
