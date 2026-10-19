import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import {
  UnidadeNomeDuplicadoError,
  UnidadeNotFoundError,
} from '../../../domain/errors/unidade.errors';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/organizacao.mapper';
import type { AtualizarUnidadeInputDto, AtualizarUnidadeOutputDto } from '../../dtos/organizacao.dto';

export type AtualizarUnidadeDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class AtualizarUnidadeUseCase extends UseCase<AtualizarUnidadeInputDto, AtualizarUnidadeOutputDto> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: AtualizarUnidadeDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarUnidadeInputDto): Promise<Result<AtualizarUnidadeOutputDto>> {
    const unidade = await this.unidadeRepository.findById(input.unidadeId);
    if (!unidade) return Result.fail(new UnidadeNotFoundError({ unidadeId: input.unidadeId }));

    if (input.nome && input.nome !== unidade.nome) {
      const duplicado = await this.unidadeRepository.existsByNome({
        redeId: unidade.redeId,
        nome: input.nome,
        ignorarId: unidade.id.toString(),
      });
      if (duplicado) return Result.fail(new UnidadeNomeDuplicadoError({ nome: input.nome }));
    }

    const atualizacao = unidade.atualizar({
      nome: input.nome,
      cnes: input.cnes,
      cnpj: input.cnpj,
      telefone: input.telefone,
      email: input.email,
      endereco: input.endereco,
      timezone: input.timezone,
      observacoes: input.observacoes,
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.unidadeRepository.update(unidade);

    return Result.ok(this.mapper.map({ unidade }));
  }
}
