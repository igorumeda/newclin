import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import { BloqueioMapper } from '../../mappers/bloqueio.mapper';
import type { BloqueioOutputDto } from '../../mappers/bloqueio.output.dto';
import type { ListarBloqueiosInputDto } from './listar-bloqueios.input.dto';

export type ListarBloqueiosDependencies = {
  bloqueioRepository: IBloqueioAgendaRepository;
  mapper: BloqueioMapper;
};

export class ListarBloqueiosUseCase extends UseCase<ListarBloqueiosInputDto, BloqueioOutputDto[]> {
  private readonly bloqueioRepository: IBloqueioAgendaRepository;
  private readonly mapper: BloqueioMapper;

  constructor(dependencies: ListarBloqueiosDependencies) {
    super();
    this.bloqueioRepository = dependencies.bloqueioRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarBloqueiosInputDto): Promise<Result<BloqueioOutputDto[]>> {
    const bloqueios = await this.bloqueioRepository.listar({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: input.profissionalId ?? null,
      inicio: input.inicio,
      fim: input.fim,
    });
    return Result.ok(bloqueios.map((bloqueio) => this.mapper.map({ bloqueio })));
  }
}
