import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { RedeNaoEncontradaError } from '../../../domain/errors/rede-nao-encontrada.error';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { RedeMapper } from '../../mappers/rede.mapper';
import type { RedeOutputDto } from '../../mappers/rede.output.dto';
import type { ObterRedeInputDto } from './obter-rede.input.dto';

export type ObterRedeDependencies = { redeRepository: IRedeRepository; mapper: RedeMapper };

export class ObterRedeUseCase extends UseCase<ObterRedeInputDto, RedeOutputDto> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: RedeMapper;

  constructor(dependencies: ObterRedeDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterRedeInputDto): Promise<Result<RedeOutputDto>> {
    const rede = await this.redeRepository.buscarPorId({ id: input.redeId });
    if (!rede) return Result.fail(new RedeNaoEncontradaError({ redeId: input.redeId }));
    return Result.ok(this.mapper.map({ rede }));
  }
}
