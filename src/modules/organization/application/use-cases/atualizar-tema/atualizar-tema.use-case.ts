import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Tema, TEMA_PRESETS } from '../../../domain/value-objects/tema.vo';
import { RedeNotFoundError } from '../../../domain/errors/unidade.errors';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import type { AtualizarTemaInputDto, AtualizarTemaOutputDto } from '../../dtos/organizacao.dto';

export type AtualizarTemaDependencies = {
  redeRepository: IRedeRepository;
};

/**
 * Aplica um preset de cores (§3.7) e permite customização livre de cada cor.
 * Somente o Admin da Rede executa esta ação (validado na rota).
 */
export class AtualizarTemaUseCase extends UseCase<AtualizarTemaInputDto, AtualizarTemaOutputDto> {
  private readonly redeRepository: IRedeRepository;

  constructor(dependencies: AtualizarTemaDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
  }

  async execute(input: AtualizarTemaInputDto): Promise<Result<AtualizarTemaOutputDto>> {
    const rede = await this.redeRepository.findById(input.redeId);
    if (!rede) return Result.fail(new RedeNotFoundError({ redeId: input.redeId }));

    const temaAtual = rede.tema;
    const baseResult = input.preset ? Tema.fromPreset(input.preset) : Result.ok(temaAtual);
    if (baseResult.isFailure) return Result.fail(baseResult.error);

    const base = baseResult.value;
    const temaResult = Tema.create({
      preset: input.preset ?? base.preset,
      light: { ...base.light, ...(input.coresLight ?? {}) },
      dark: { ...base.dark, ...(input.coresDark ?? {}) },
    });
    if (temaResult.isFailure) return Result.fail(temaResult.error);

    rede.aplicarTema(temaResult.value);
    await this.redeRepository.update(rede);

    return Result.ok({ tema: temaResult.value.toJSON(), presets: TEMA_PRESETS });
  }
}
