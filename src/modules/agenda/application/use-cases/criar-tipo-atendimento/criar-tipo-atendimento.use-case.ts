import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TipoAtendimento } from '../../../domain/entities/tipo-atendimento.entity';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import { TipoAtendimentoMapper } from '../../mappers/tipo-atendimento.mapper';
import type { TipoAtendimentoOutputDto } from '../../mappers/tipo-atendimento.output.dto';
import type { CriarTipoAtendimentoInputDto } from './criar-tipo-atendimento.input.dto';

export type CriarTipoAtendimentoDependencies = {
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  mapper: TipoAtendimentoMapper;
};

export class CriarTipoAtendimentoUseCase extends UseCase<
  CriarTipoAtendimentoInputDto,
  TipoAtendimentoOutputDto
> {
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: CriarTipoAtendimentoDependencies) {
    super();
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarTipoAtendimentoInputDto): Promise<Result<TipoAtendimentoOutputDto>> {
    const existente = await this.tipoAtendimentoRepository.buscarPorNome({
      redeId: input.redeId,
      nome: input.nome,
    });
    if (existente) {
      return Result.fail(new Error('Já existe um tipo de atendimento com este nome'));
    }

    const tipoResult = TipoAtendimento.create({
      redeId: input.redeId,
      nome: input.nome,
      duracaoMinutos: input.duracaoMinutos,
      cor: input.cor,
    });
    if (tipoResult.isFailure) return Result.propagate(tipoResult);

    await this.tipoAtendimentoRepository.salvar(tipoResult.value);
    return Result.ok(this.mapper.map({ tipoAtendimento: tipoResult.value }));
  }
}
