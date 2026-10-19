import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import type { IIdentityProvider } from '../../../domain/services/identity-provider.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { AtualizarUsuarioInputDto } from './atualizar-usuario.input.dto';
import type { AtualizarUsuarioOutputDto } from './atualizar-usuario.output.dto';

export type AtualizarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  identityProvider: IIdentityProvider;
  mapper: UsuarioMapper;
};

export class AtualizarUsuarioUseCase extends UseCase<AtualizarUsuarioInputDto, AtualizarUsuarioOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly identityProvider: IIdentityProvider;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: AtualizarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.identityProvider = dependencies.identityProvider;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarUsuarioInputDto): Promise<Result<AtualizarUsuarioOutputDto>> {
    const usuario = await this.usuarioRepository.findById(input.usuarioId);
    if (!usuario) return Result.fail(new UserNotFoundError({ userId: input.usuarioId }));

    if (input.role && input.role !== usuario.role.value) {
      const roleResult = usuario.alterarRole({ role: input.role });
      if (roleResult.isFailure) return Result.fail(roleResult.error);
    }

    const dadosResult = usuario.alterarDados({
      nome: input.nome,
      telefone: input.telefone,
      unidadesAcesso: input.unidadesAcesso,
      profissionalId: input.profissionalId,
    });
    if (dadosResult.isFailure) return Result.fail(dadosResult.error);

    await this.usuarioRepository.update(usuario);

    if (usuario.authUserId) {
      await this.identityProvider.atualizarUsuario({
        authUserId: usuario.authUserId,
        nome: usuario.nome.value,
        role: usuario.role.value,
        unidadesAcesso: usuario.unidadesAcesso,
        profissionalId: usuario.profissionalId,
      });
    }

    return Result.ok(this.mapper.map({ usuario }));
  }
}
