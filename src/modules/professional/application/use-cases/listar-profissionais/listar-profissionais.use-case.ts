import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type {
  ListarProfissionaisInputDto,
  ListarProfissionaisOutputDto,
} from '../../dtos/profissional.dto';

export type ListarProfissionaisDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class ListarProfissionaisUseCase extends UseCase<
  ListarProfissionaisInputDto,
  ListarProfissionaisOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: ListarProfissionaisDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarProfissionaisInputDto): Promise<Result<ListarProfissionaisOutputDto>> {
    const profissionais = await this.profissionalRepository.listar({
      redeId: input.redeId,
      busca: input.busca ?? null,
      especialidade: input.especialidade ?? null,
      unidadeId: input.unidadeId ?? null,
      ativo: input.ativo ?? null,
    });

    const items = await Promise.all(
      profissionais.map(async (profissional) => {
        const unidades = await this.profissionalRepository.listarUnidades({
          profissionalId: profissional.id.toString(),
        });
        const horarios = input.incluirHorarios
          ? await this.profissionalRepository.listarHorarios({
              profissionalId: profissional.id.toString(),
            })
          : [];
        return this.mapper.map({ profissional, unidades, horarios });
      }),
    );

    return Result.ok({ items });
  }
}
