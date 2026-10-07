import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Anexo } from '../../../domain/entities/anexo.entity';
import type { IAnexoRepository } from '../../../domain/repositories/anexo-repository.interface';
import { AnexoMapper } from '../../mappers/anexo.mapper';
import type { AnexoOutputDto } from '../../mappers/anexo.output.dto';
import type { RegistrarAnexoInputDto } from './registrar-anexo.input.dto';

export type RegistrarAnexoDependencies = {
  anexoRepository: IAnexoRepository;
  mapper: AnexoMapper;
};

export class RegistrarAnexoUseCase extends UseCase<RegistrarAnexoInputDto, AnexoOutputDto> {
  private readonly anexoRepository: IAnexoRepository;
  private readonly mapper: AnexoMapper;

  constructor(dependencies: RegistrarAnexoDependencies) {
    super();
    this.anexoRepository = dependencies.anexoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: RegistrarAnexoInputDto): Promise<Result<AnexoOutputDto>> {
    const anexoResult = Anexo.create({
      redeId: input.redeId,
      pacienteId: input.pacienteId,
      atendimentoId: input.atendimentoId,
      nomeArquivo: input.nomeArquivo,
      mimeType: input.mimeType,
      tamanhoBytes: input.tamanhoBytes,
      storageKey: input.storageKey,
      descricao: input.descricao,
      enviadoPor: input.enviadoPor,
    });
    if (anexoResult.isFailure) return Result.propagate(anexoResult);

    await this.anexoRepository.salvar(anexoResult.value);
    return Result.ok(this.mapper.map({ anexo: anexoResult.value }));
  }
}
