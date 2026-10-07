import { ForbiddenError } from '@core/domain/errors/forbidden.error';

export type PermissaoNegadaErrorParams = { permissao: string };

export class PermissaoNegadaError extends ForbiddenError {
  constructor(params: PermissaoNegadaErrorParams) {
    super({
      message: `Você não tem permissão para "${params.permissao}"`,
      code: 'PERMISSAO_NEGADA',
    });
    this.name = 'PermissaoNegadaError';
  }
}
