import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import { CadastroConviteInvalidoError } from '../errors/cadastro-convite-invalido.error';
import { UserName } from './user-name.vo';
import { Senha } from './senha.vo';
import { SenhaInvalidaError } from '../errors/senha-invalida.error';

export type CadastroConviteParams = {
  nome: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
};
type CadastroConviteProps = { nome: string; telefone: string | null; senha: string };

export class CadastroConvite extends ValueObject<CadastroConviteProps> {
  private constructor(props: CadastroConviteProps) {
    super(props);
  }
  get nome(): string {
    return this.props.nome;
  }
  get telefone(): string | null {
    return this.props.telefone;
  }
  get senha(): string {
    return this.props.senha;
  }
  public static create(params: CadastroConviteParams): Result<CadastroConvite> {
    const nome = UserName.create(params.nome);
    if (nome.isFailure)
      return Result.fail(
        new CadastroConviteInvalidoError({ message: nome.error.message, field: 'nome' }),
      );
    const telefone = params.telefone.trim();
    if (telefone && !/^\+?[\d\s().-]+$/.test(telefone))
      return Result.fail(
        new CadastroConviteInvalidoError({
          message: 'Informe um telefone válido.',
          field: 'telefone',
        }),
      );
    const digitos = telefone.replace(/\D/g, '');
    if (telefone && (digitos.length < 10 || digitos.length > 15))
      return Result.fail(
        new CadastroConviteInvalidoError({
          message: 'O telefone deve ter entre 10 e 15 dígitos.',
          field: 'telefone',
        }),
      );
    const senha = Senha.create(params);
    if (senha.isFailure)
      return Result.fail(
        new CadastroConviteInvalidoError({
          message: senha.error.message,
          field: senha.error instanceof SenhaInvalidaError ? senha.error.field : 'senha',
        }),
      );
    return Result.ok(
      new CadastroConvite({
        nome: nome.value.value,
        telefone: telefone || null,
        senha: senha.value.value,
      }),
    );
  }
}
