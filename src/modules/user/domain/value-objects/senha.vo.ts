import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import { SenhaInvalidaError } from '../errors/senha-invalida.error';
export type SenhaParams = { senha: string; confirmarSenha: string };
type SenhaProps = { value: string };
export class Senha extends ValueObject<SenhaProps> {
  private constructor(props: SenhaProps) {
    super(props);
  }
  get value(): string {
    return this.props.value;
  }
  public static create(params: SenhaParams): Result<Senha> {
    if (params.senha.length < 8 || params.senha.length > 128)
      return Result.fail(
        new SenhaInvalidaError({
          message: 'A senha deve ter entre 8 e 128 caracteres.',
          field: 'senha',
        }),
      );
    if (params.senha !== params.confirmarSenha)
      return Result.fail(
        new SenhaInvalidaError({
          message: 'As senhas não coincidem.',
          field: 'confirmarSenha',
        }),
      );
    return Result.ok(new Senha({ value: params.senha }));
  }
}
