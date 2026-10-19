import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { RedeNotFoundError } from '../../../domain/errors/unidade.errors';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { OrganizacaoMapper } from '../../mappers/organizacao.mapper';
import type {
  ObterOrganizacaoInputDto,
  ObterOrganizacaoOutputDto,
} from '../../dtos/organizacao.dto';

export type ObterOrganizacaoDependencies = {
  redeRepository: IRedeRepository;
  mapper: OrganizacaoMapper;
};

export class ObterOrganizacaoUseCase extends UseCase<ObterOrganizacaoInputDto, ObterOrganizacaoOutputDto> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: OrganizacaoMapper;

  constructor(dependencies: ObterOrganizacaoDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterOrganizacaoInputDto): Promise<Result<ObterOrganizacaoOutputDto>> {
    const rede = await this.redeRepository.findById(input.redeId);
    if (!rede) return Result.fail(new RedeNotFoundError({ redeId: input.redeId }));

    return Result.ok(this.mapper.map({ rede }));
  }
}
