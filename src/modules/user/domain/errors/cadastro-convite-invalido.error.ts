import { ValidationError } from '@core/domain/errors/validation.error';
import type { CadastroConviteParams } from '../value-objects/cadastro-convite.vo';

type CadastroConviteInvalidoParams = {
  message: string;
  field: keyof CadastroConviteParams;
};
export class CadastroConviteInvalidoError extends ValidationError {
  readonly field: keyof CadastroConviteParams;
  constructor(params: CadastroConviteInvalidoParams) {
    super({ message: params.message, code: 'CADASTRO_CONVITE_INVALIDO' });
    this.field = params.field;
  }
}
