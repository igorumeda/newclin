import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Evolucao } from '../../../domain/entities/evolucao.entity';
import { AtendimentoNotFoundError } from '../../../domain/errors/prontuario.errors';
import type {
  IAtendimentoRepository,
  IEvolucaoRepository,
} from '../../../domain/repositories/prontuario-repositories.interface';
import type { EvolucaoMapper } from '../../mappers/prontuario.mapper';
import type {
  AdicionarAdendoInputDto,
  AdicionarAdendoOutputDto,
  EvolucaoDto,
} from '../../dtos/prontuario.dto';

export type AdendoUseCasesDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  evolucaoRepository: IEvolucaoRepository;
  mapper: EvolucaoMapper;
};

/**
 * Correções e complementos do prontuário (§3.5). Somente inserção — o
 * atendimento original permanece intacto e o adendo registra data e autor.
 */
export class AdicionarAdendoUseCase extends UseCase<AdicionarAdendoInputDto, AdicionarAdendoOutputDto> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly evolucaoRepository: IEvolucaoRepository;
  private readonly mapper: EvolucaoMapper;

  constructor(dependencies: AdendoUseCasesDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.evolucaoRepository = dependencies.evolucaoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AdicionarAdendoInputDto): Promise<Result<AdicionarAdendoOutputDto>> {
    const atendimento = await this.atendimentoRepository.findById(input.atendimentoId);
    if (!atendimento) return Result.fail(new AtendimentoNotFoundError({ atendimentoId: input.atendimentoId }));

    const evolucaoResult = Evolucao.create({
      redeId: atendimento.redeId,
      atendimentoId: input.atendimentoId,
      pacienteId: atendimento.pacienteId,
      profissionalId: atendimento.profissionalId,
      tipo: input.tipo ?? 'adendo',
      conteudo: input.conteudo,
      dados: input.dados,
      createdBy: input.autorId ?? null,
    });
    if (evolucaoResult.isFailure) return Result.fail(evolucaoResult.error);

    const evolucao = evolucaoResult.value;
    await this.evolucaoRepository.save(evolucao);

    return Result.ok(this.mapper.map({ evolucao }));
  }
}

export class ListarEvolucoesUseCase extends UseCase<{ atendimentoId: string }, EvolucaoDto[]> {
  private readonly evolucaoRepository: IEvolucaoRepository;
  private readonly mapper: EvolucaoMapper;

  constructor(dependencies: AdendoUseCasesDependencies) {
    super();
    this.evolucaoRepository = dependencies.evolucaoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: { atendimentoId: string }): Promise<Result<EvolucaoDto[]>> {
    const evolucoes = await this.evolucaoRepository.listarPorAtendimento(input.atendimentoId);
    return Result.ok(evolucoes.map((evolucao) => this.mapper.map({ evolucao })));
  }
}
