import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Senha } from '../../../domain/value-objects/senha.vo';
import { CredenciaisInvalidasError } from '../../../domain/errors/credenciais-invalidas.error';
import { UsuarioNaoEncontradoError } from '../../../domain/errors/usuario-nao-encontrado.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IHashProvider } from '../../../domain/services/hash-provider.interface';
import type { AlterarSenhaInputDto } from './alterar-senha.input.dto';

export type AlterarSenhaDependencies = {
  usuarioRepository: IUsuarioRepository;
  hashProvider: IHashProvider;
};

export type AlterarSenhaOutputDto = { alterada: boolean };

export class AlterarSenhaUseCase extends UseCase<AlterarSenhaInputDto, AlterarSenhaOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly hashProvider: IHashProvider;

  constructor(dependencies: AlterarSenhaDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.hashProvider = dependencies.hashProvider;
  }

  async execute(input: AlterarSenhaInputDto): Promise<Result<AlterarSenhaOutputDto>> {
    const usuario = await this.usuarioRepository.buscarPorId({
      redeId: input.redeId,
      id: input.usuarioId,
    });
    if (!usuario) return Result.fail(new UsuarioNaoEncontradoError({ usuarioId: input.usuarioId }));

    if (input.exigirSenhaAtual) {
      const confere = await this.hashProvider.compare({
        plain: input.senhaAtual ?? '',
        hashed: usuario.senhaHash,
      });
      if (!confere) return Result.fail(new CredenciaisInvalidasError());
    }

    const senhaResult = Senha.create(input.novaSenha);
    if (senhaResult.isFailure) return Result.propagate(senhaResult);

    const hash = await this.hashProvider.hash({ plain: senhaResult.value.value });
    const alteracaoResult = usuario.alterarSenha(hash);
    if (alteracaoResult.isFailure) return Result.propagate(alteracaoResult);

    await this.usuarioRepository.atualizar(usuario);
    return Result.ok({ alterada: true });
  }
}
