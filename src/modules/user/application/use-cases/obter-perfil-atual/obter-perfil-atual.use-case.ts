import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { ObterPerfilAtualInputDto } from './obter-perfil-atual.input.dto';
import type { ObterPerfilAtualOutputDto } from './obter-perfil-atual.output.dto';

export type ObterPerfilAtualDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class ObterPerfilAtualUseCase extends UseCase<ObterPerfilAtualInputDto, ObterPerfilAtualOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: ObterPerfilAtualDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterPerfilAtualInputDto): Promise<Result<ObterPerfilAtualOutputDto>> {
    const usuario = await this.usuarioRepository.findById(input.usuarioId);
    if (!usuario) return Result.fail(new UserNotFoundError({ userId: input.usuarioId }));

    return Result.ok({
      usuario: this.mapper.map({ usuario }),
      permissoes: usuario.role.permissions,
    });
  }
}
