import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Adendo } from '../../../domain/entities/adendo.entity';
import { AtendimentoNaoEncontradoError } from '../../../domain/errors/atendimento-nao-encontrado.error';
import type { IAtendimentoRepository } from '../../../domain/repositories/atendimento-repository.interface';
import { AdendoMapper } from '../../mappers/adendo.mapper';
import type { AdendoOutputDto } from '../../mappers/atendimento.output.dto';
import type { AdicionarAdendoInputDto } from './adicionar-adendo.input.dto';

export type AdicionarAdendoDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  mapper: AdendoMapper;
};

export class AdicionarAdendoUseCase extends UseCase<AdicionarAdendoInputDto, AdendoOutputDto> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly mapper: AdendoMapper;

  constructor(dependencies: AdicionarAdendoDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AdicionarAdendoInputDto): Promise<Result<AdendoOutputDto>> {
    const atendimento = await this.atendimentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.atendimentoId,
    });
    if (!atendimento) {
      return Result.fail(
        new AtendimentoNaoEncontradoError({ atendimentoId: input.atendimentoId }),
      );
    }
    if (!atendimento.isFinalizado) {
      return Result.fail(
        new Error('Adendos só são permitidos em atendimentos já finalizados'),
      );
    }

    const adendoResult = Adendo.create({
      redeId: input.redeId,
      atendimentoId: input.atendimentoId,
      profissionalId: input.profissionalId,
      usuarioId: input.usuarioId,
      conteudo: input.conteudo,
    });
    if (adendoResult.isFailure) return Result.propagate(adendoResult);

    await this.atendimentoRepository.salvarAdendo(adendoResult.value);
    return Result.ok(this.mapper.map({ adendo: adendoResult.value }));
  }
}
