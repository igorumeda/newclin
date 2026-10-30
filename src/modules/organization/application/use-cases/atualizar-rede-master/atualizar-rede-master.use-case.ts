import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import {
  RedeCnpjDuplicadoError,
  RedeNotFoundError,
  RedeSlugDuplicadoError,
} from '../../../domain/errors/unidade.errors';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import { Tema } from '../../../domain/value-objects/tema.vo';
import { OrganizacaoMapper } from '../../mappers/organizacao.mapper';
import type {
  AtualizarRedeMasterInputDto,
  AtualizarRedeMasterOutputDto,
} from '../../dtos/organizacao.dto';
import { AcessoMasterExigidoError } from '../obter-resumo-master/obter-resumo-master.use-case';

export type AtualizarRedeMasterDependencies = {
  redeRepository: IRedeRepository;
  mapper: OrganizacaoMapper;
};

/** Atualiza dados cadastrais, tema ou status de uma rede pelo painel Master. */
export class AtualizarRedeMasterUseCase extends UseCase<
  AtualizarRedeMasterInputDto,
  AtualizarRedeMasterOutputDto
> {
  private readonly redeRepository: IRedeRepository;
  private readonly mapper: OrganizacaoMapper;

  constructor(dependencies: AtualizarRedeMasterDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: AtualizarRedeMasterInputDto,
  ): Promise<Result<AtualizarRedeMasterOutputDto>> {
    if (!input.isMaster) {
      return Result.fail(new AcessoMasterExigidoError());
    }

    const rede = await this.redeRepository.findById(input.redeId);
    if (!rede) {
      return Result.fail(new RedeNotFoundError({ redeId: input.redeId }));
    }

    const atualizacao = rede.atualizarDados({
      nome: input.nome,
      razaoSocial: input.razaoSocial,
      cnpj: input.cnpj,
      slug: input.slug,
      email: input.email,
      telefone: input.telefone,
      ativo: input.ativo,
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    if (input.presetTema) {
      const temaResult = Tema.fromPreset(input.presetTema);
      if (temaResult.isFailure) return Result.fail(temaResult.error);
      rede.aplicarTema(temaResult.value);
    }

    if (rede.cnpj) {
      const cnpjEmUso = await this.redeRepository.existsByCnpj({
        cnpj: rede.cnpj,
        excludeId: rede.id.toString(),
      });
      if (cnpjEmUso) {
        return Result.fail(new RedeCnpjDuplicadoError({ cnpj: rede.cnpj }));
      }
    }

    if (rede.slug) {
      const slugEmUso = await this.redeRepository.existsBySlug({
        slug: rede.slug,
        excludeId: rede.id.toString(),
      });
      if (slugEmUso) {
        return Result.fail(new RedeSlugDuplicadoError({ slug: rede.slug }));
      }
    }

    await this.redeRepository.update(rede);

    return Result.ok(this.mapper.map({ rede }));
  }
}

