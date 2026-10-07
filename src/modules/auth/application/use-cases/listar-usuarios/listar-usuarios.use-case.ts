import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { UsuarioOutputDto } from '../../mappers/usuario.output.dto';
import type { ListarUsuariosInputDto } from './listar-usuarios.input.dto';

export type ListarUsuariosDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class ListarUsuariosUseCase extends UseCase<ListarUsuariosInputDto, UsuarioOutputDto[]> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: ListarUsuariosDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarUsuariosInputDto): Promise<Result<UsuarioOutputDto[]>> {
    const usuarios = await this.usuarioRepository.listar({
      redeId: input.redeId,
      busca: input.busca,
      incluirInativos: input.incluirInativos ?? true,
    });
    return Result.ok(usuarios.map((usuario) => this.mapper.map({ usuario })));
  }
}
