import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { RedeNaoEncontradaError } from '../../../domain/errors/rede-nao-encontrada.error';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { RedeMapper } from '../../mappers/rede.mapper';
import type { RedeOutputDto } from '../../mappers/rede.output.dto';
import type { AtualizarRedeInputDto } from './atualizar-rede.input.dto';

export type AtualizarRedeDependencies = { redeRepository: IRedeRepository; mapper: RedeMapper };

export class AtualizarRedeUseCase extends UseCase<AtualizarRedeInputDto, RedeOutputDto> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: RedeMapper;

  constructor(dependencies: AtualizarRedeDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarRedeInputDto): Promise<Result<RedeOutputDto>> {
    const rede = await this.redeRepository.buscarPorId({ id: input.redeId });
    if (!rede) return Result.fail(new RedeNaoEncontradaError({ redeId: input.redeId }));

    const atualizacao = rede.atualizar({
      nome: input.nome,
      cnpj: input.cnpj,
      logotipoUrl: input.logotipoUrl,
      config: input.config,
    });
    if (atualizacao.isFailure) return Result.propagate(atualizacao);

    await this.redeRepository.atualizar(rede);
    return Result.ok(this.mapper.map({ rede }));
  }
}
