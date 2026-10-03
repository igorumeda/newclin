import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { RedeNotFoundError } from '../../../domain/errors/unidade.errors';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { OrganizacaoMapper } from '../../mappers/organizacao.mapper';
import type {
  AtualizarOrganizacaoInputDto,
  AtualizarOrganizacaoOutputDto,
} from '../../dtos/organizacao.dto';

export type AtualizarOrganizacaoDependencies = {
  redeRepository: IRedeRepository;
  mapper: OrganizacaoMapper;
};

/** Atualiza dados cadastrais e configurações operacionais da rede (§3.1). */
export class AtualizarOrganizacaoUseCase extends UseCase<
  AtualizarOrganizacaoInputDto,
  AtualizarOrganizacaoOutputDto
> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: OrganizacaoMapper;

  constructor(dependencies: AtualizarOrganizacaoDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarOrganizacaoInputDto): Promise<Result<AtualizarOrganizacaoOutputDto>> {
    const rede = await this.redeRepository.findById(input.redeId);
    if (!rede) return Result.fail(new RedeNotFoundError({ redeId: input.redeId }));

    const atualizacao = rede.atualizarDados({
      nome: input.nome,
      razaoSocial: input.razaoSocial,
      cnpj: input.cnpj,
      slug: input.slug,
      email: input.email,
      telefone: input.telefone,
      config: input.config,
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.redeRepository.update(rede);

    return Result.ok(this.mapper.map({ rede }));
  }
}
