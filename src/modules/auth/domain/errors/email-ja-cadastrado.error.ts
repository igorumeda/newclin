import { ConflictError } from '@core/domain/errors/conflict.error';

export type EmailJaCadastradoErrorParams = { email: string };

export class EmailJaCadastradoError extends ConflictError {
  constructor(params: EmailJaCadastradoErrorParams) {
    super({
      message: `Já existe um usuário com o e-mail "${params.email}"`,
      code: 'EMAIL_JA_CADASTRADO',
    });
    this.name = 'EmailJaCadastradoError';
  }
}
