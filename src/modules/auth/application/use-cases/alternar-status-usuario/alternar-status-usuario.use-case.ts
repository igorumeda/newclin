import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UsuarioNaoEncontradoError } from '../../../domain/errors/usuario-nao-encontrado.error';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioOutputDto } from '../../mappers/usuario.output.dto';
import type { AlternarStatusUsuarioInputDto } from './alternar-status-usuario.input.dto';

export type AlternarStatusUsuarioDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class AlternarStatusUsuarioUseCase extends UseCase<
  AlternarStatusUsuarioInputDto,
  UsuarioOutputDto
> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: AlternarStatusUsuarioDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AlternarStatusUsuarioInputDto): Promise<Result<UsuarioOutputDto>> {
    const usuario = await this.usuarioRepository.buscarPorId({ redeId: input.redeId, id: input.id });
    if (!usuario) return Result.fail(new UsuarioNaoEncontradoError({ usuarioId: input.id }));

    const result = input.ativo ? usuario.reativar() : usuario.desativar();
    if (result.isFailure) return Result.propagate(result);

    await this.usuarioRepository.atualizar(usuario);
    return Result.ok(this.mapper.map({ usuario }));
  }
}
