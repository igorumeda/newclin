import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Rede } from '../../../domain/entities/rede.entity';
import {
  RedeCnpjDuplicadoError,
  RedeSlugDuplicadoError,
} from '../../../domain/errors/unidade.errors';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { OrganizacaoMapper } from '../../mappers/organizacao.mapper';
import type {
  CriarRedeMasterInputDto,
  CriarRedeMasterOutputDto,
} from '../../dtos/organizacao.dto';
import { AcessoMasterExigidoError } from '../obter-resumo-master/obter-resumo-master.use-case';

export type CriarRedeMasterDependencies = {
  redeRepository: IRedeRepository;
  mapper: OrganizacaoMapper;
};

/** Cria uma nova rede (tenant) a partir do painel administrativo Master. */
export class CriarRedeMasterUseCase extends UseCase<
  CriarRedeMasterInputDto,
  CriarRedeMasterOutputDto
> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: OrganizacaoMapper;

  constructor(dependencies: CriarRedeMasterDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: CriarRedeMasterInputDto,
  ): Promise<Result<CriarRedeMasterOutputDto>> {
    if (!input.isMaster) {
      return Result.fail(new AcessoMasterExigidoError());
    }

    const redeResult = Rede.create({
      nome: input.nome,
      razaoSocial: input.razaoSocial,
      cnpj: input.cnpj,
      slug: input.slug,
      email: input.email,
      telefone: input.telefone,
      presetTema: input.presetTema,
      ativo: input.ativo ?? true,
    });
    if (redeResult.isFailure) return Result.fail(redeResult.error);

    const rede = redeResult.value;

    if (rede.cnpj) {
      const cnpjEmUso = await this.redeRepository.existsByCnpj({ cnpj: rede.cnpj });
      if (cnpjEmUso) {
        return Result.fail(new RedeCnpjDuplicadoError({ cnpj: rede.cnpj }));
      }
    }

    if (rede.slug) {
      const slugEmUso = await this.redeRepository.existsBySlug({ slug: rede.slug });
      if (slugEmUso) {
        return Result.fail(new RedeSlugDuplicadoError({ slug: rede.slug }));
      }
    }

    await this.redeRepository.create(rede);

    return Result.ok(this.mapper.map({ rede }));
  }
}

