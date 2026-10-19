import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Profissional } from '../../../domain/entities/profissional.entity';
import { RegistroDuplicadoError } from '../../../domain/errors/profissional.errors';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type {
  CriarProfissionalInputDto,
  CriarProfissionalOutputDto,
} from '../../dtos/profissional.dto';

export type CriarProfissionalDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class CriarProfissionalUseCase extends UseCase<CriarProfissionalInputDto, CriarProfissionalOutputDto> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: CriarProfissionalDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarProfissionalInputDto): Promise<Result<CriarProfissionalOutputDto>> {
    const profissionalResult = Profissional.create(input);
    if (profissionalResult.isFailure) return Result.fail(profissionalResult.error);

    const profissional = profissionalResult.value;

    const duplicado = await this.profissionalRepository.existsByRegistro({
      redeId: input.redeId,
      conselhoClasse: profissional.registro.conselhoClasse,
      numeroConselho: profissional.registro.numero,
      ufConselho: profissional.registro.uf,
    });
    if (duplicado) {
      return Result.fail(new RegistroDuplicadoError({ registro: profissional.registro.formatado() }));
    }

    await this.profissionalRepository.save(profissional);

    if (input.unidades && input.unidades.length > 0) {
      await this.profissionalRepository.definirUnidades({
        redeId: input.redeId,
        profissionalId: profissional.id.toString(),
        unidadeIds: input.unidades,
      });
    }

    return Result.ok(
      this.mapper.map({
        profissional,
        unidades: input.unidades ?? [],
        horarios: [],
      }),
    );
  }
}
