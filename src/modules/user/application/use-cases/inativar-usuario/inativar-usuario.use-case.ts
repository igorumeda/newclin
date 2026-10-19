import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ForbiddenError } from '@core/domain/errors/forbidden.error';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { InativarUsuarioInputDto } from './inativar-usuario.input.dto';
import type { InativarUsuarioOutputDto } from './inativar-usuario.output.dto';

export type InativarUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class AutoinativacaoError extends ForbiddenError {
  constructor() {
    super({
      message: 'Você não pode inativar o seu próprio acesso',
      code: 'SELF_DEACTIVATION_NOT_ALLOWED',
    });
    this.name = 'AutoinativacaoError';
  }
}

export class InativarUsuarioUseCase extends UseCase<InativarUsuarioInputDto, InativarUsuarioOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: InativarUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: InativarUsuarioInputDto): Promise<Result<InativarUsuarioOutputDto>> {
    if (input.usuarioId === input.solicitanteId) {
      return Result.fail(new AutoinativacaoError());
    }

    const usuario = await this.usuarioRepository.findById(input.usuarioId);
    if (!usuario) return Result.fail(new UserNotFoundError({ userId: input.usuarioId }));

    const result = usuario.inativar();
    if (result.isFailure) return Result.fail(result.error);

    await this.usuarioRepository.update(usuario);

    return Result.ok(this.mapper.map({ usuario }));
  }
}
