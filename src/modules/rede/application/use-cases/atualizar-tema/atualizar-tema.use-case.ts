import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { RedeNaoEncontradaError } from '../../../domain/errors/rede-nao-encontrada.error';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { RedeMapper } from '../../mappers/rede.mapper';
import type { RedeOutputDto } from '../../mappers/rede.output.dto';
import type { AtualizarTemaInputDto } from './atualizar-tema.input.dto';

export type AtualizarTemaDependencies = { redeRepository: IRedeRepository; mapper: RedeMapper };

export class AtualizarTemaUseCase extends UseCase<AtualizarTemaInputDto, RedeOutputDto> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: RedeMapper;

  constructor(dependencies: AtualizarTemaDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarTemaInputDto): Promise<Result<RedeOutputDto>> {
    const rede = await this.redeRepository.buscarPorId({ id: input.redeId });
    if (!rede) return Result.fail(new RedeNaoEncontradaError({ redeId: input.redeId }));

    const resultado = rede.aplicarTema({ cores: input.cores, preset: input.preset });
    if (resultado.isFailure) return Result.propagate(resultado);

    await this.redeRepository.atualizar(rede);
    return Result.ok(this.mapper.map({ rede }));
  }
}
