import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { ReativarUsuarioInputDto } from './reativar-usuario.input.dto';
import type { ReativarUsuarioOutputDto } from './reativar-usuario.output.dto';

export type ReativarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class ReativarUsuarioUseCase extends UseCase<ReativarUsuarioInputDto, ReativarUsuarioOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: ReativarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ReativarUsuarioInputDto): Promise<Result<ReativarUsuarioOutputDto>> {
    const usuario = await this.usuarioRepository.findById(input.usuarioId);
    if (!usuario) return Result.fail(new UserNotFoundError({ userId: input.usuarioId }));

    const result = usuario.reativar();
    if (result.isFailure) return Result.fail(result.error);

    await this.usuarioRepository.update(usuario);

    return Result.ok(this.mapper.map({ usuario }));
  }
}
