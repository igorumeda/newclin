import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Email } from '../../../domain/value-objects/email.vo';
import { CredenciaisInvalidasError } from '../../../domain/errors/credenciais-invalidas.error';
import { UsuarioInativoError } from '../../../domain/errors/usuario-inativo.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IHashProvider } from '../../../domain/services/hash-provider.interface';
import type { ITokenProvider } from '../../../domain/services/token-provider.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { AutenticarUsuarioInputDto } from './autenticar-usuario.input.dto';
import type { AutenticarUsuarioOutputDto } from './autenticar-usuario.output.dto';

export type AutenticarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  hashProvider: IHashProvider;
  tokenProvider: ITokenProvider;
  mapper: UsuarioMapper;
  sessaoTtlHoras: number;
};

export class AutenticarUsuarioUseCase extends UseCase<
  AutenticarUsuarioInputDto,
  AutenticarUsuarioOutputDto
> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly hashProvider: IHashProvider;
  private readonly tokenProvider: ITokenProvider;
  private readonly mapper: UsuarioMapper;
  private readonly sessaoTtlHoras: number;

  constructor(dependencies: AutenticarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.hashProvider = dependencies.hashProvider;
    this.tokenProvider = dependencies.tokenProvider;
    this.mapper = dependencies.mapper;
    this.sessaoTtlHoras = dependencies.sessaoTtlHoras;
  }

  async execute(input: AutenticarUsuarioInputDto): Promise<Result<AutenticarUsuarioOutputDto>> {
    const emailResult = Email.create(input.email);
    if (emailResult.isFailure) return Result.fail(new CredenciaisInvalidasError());

    const usuario = await this.usuarioRepository.buscarPorEmail({ email: emailResult.value });
    if (!usuario) return Result.fail(new CredenciaisInvalidasError());

    const senhaConfere = await this.hashProvider.compare({
      plain: input.senha,
      hashed: usuario.senhaHash,
    });
    if (!senhaConfere) return Result.fail(new CredenciaisInvalidasError());

    const acessoResult = usuario.registrarAcesso();
    if (acessoResult.isFailure) return Result.fail(new UsuarioInativoError());

    await this.usuarioRepository.atualizar(usuario);

    const token = await this.tokenProvider.assinar({
      payload: {
        usuarioId: usuario.id.toString(),
        redeId: usuario.redeId,
        nome: usuario.nome.value,
        email: usuario.email.value,
        role: usuario.papel.value,
        unidadesAcesso: usuario.unidadesAcesso,
        profissionalId: usuario.profissionalId,
      },
      expiraEmHoras: this.sessaoTtlHoras,
    });

    const expiraEm = new Date(Date.now() + this.sessaoTtlHoras * 3_600_000);

    return Result.ok({
      token,
      expiraEm: expiraEm.toISOString(),
      usuario: this.mapper.map({ usuario }),
    });
  }
}
