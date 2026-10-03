import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { buildPaginationMeta, normalizePagination } from '@core/application/pagination/pagination';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario-repository.interface';
import { UsuarioMapper } from '../../mappers/usuario.mapper';
import type { ListarUsuariosInputDto } from './listar-usuarios.input.dto';
import type { ListarUsuariosOutputDto } from './listar-usuarios.output.dto';

export type ListarUsuariosDependencies = {
  usuarioRepository: IUsuarioRepository;
  mapper: UsuarioMapper;
};

export class ListarUsuariosUseCase extends UseCase<ListarUsuariosInputDto, ListarUsuariosOutputDto> {
  private readonly usuarioRepository: IUsuarioRepository;
  private readonly mapper: UsuarioMapper;

  constructor(dependencies: ListarUsuariosDependencies) {
    super();
    this.usuarioRepository = dependencies.usuarioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarUsuariosInputDto): Promise<Result<ListarUsuariosOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const { items, total } = await this.usuarioRepository.listar({
      redeId: input.redeId,
      busca: input.busca ?? null,
      role: input.role ?? null,
      ativo: input.ativo ?? null,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    return Result.ok({
      items: items.map((usuario) => this.mapper.map({ usuario })),
      meta: buildPaginationMeta({ pagination, total }),
    });
  }
}
