import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IAnexoRepository } from '../../../domain/repositories/anexo-repository.interface';
import { AnexoMapper } from '../../mappers/anexo.mapper';
import type { AnexoOutputDto } from '../../mappers/anexo.output.dto';
import type { ListarAnexosInputDto } from './listar-anexos.input.dto';

export type ListarAnexosDependencies = { anexoRepository: IAnexoRepository; mapper: AnexoMapper };

export class ListarAnexosUseCase extends UseCase<ListarAnexosInputDto, AnexoOutputDto[]> {
  private readonly anexoRepository: IAnexoRepository;
  private readonly mapper: AnexoMapper;

  constructor(dependencies: ListarAnexosDependencies) {
    super();
    this.anexoRepository = dependencies.anexoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarAnexosInputDto): Promise<Result<AnexoOutputDto[]>> {
    const anexos = await this.anexoRepository.listar({
      redeId: input.redeId,
      pacienteId: input.pacienteId ?? null,
      atendimentoId: input.atendimentoId ?? null,
    });
    return Result.ok(anexos.map((anexo) => this.mapper.map({ anexo })));
  }
}
