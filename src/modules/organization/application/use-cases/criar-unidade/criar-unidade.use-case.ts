import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Unidade } from '../../../domain/entities/unidade.entity';
import { UnidadeNomeDuplicadoError } from '../../../domain/errors/unidade.errors';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/organizacao.mapper';
import type { CriarUnidadeInputDto, CriarUnidadeOutputDto } from '../../dtos/organizacao.dto';

export type CriarUnidadeDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class CriarUnidadeUseCase extends UseCase<CriarUnidadeInputDto, CriarUnidadeOutputDto> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: CriarUnidadeDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarUnidadeInputDto): Promise<Result<CriarUnidadeOutputDto>> {
    const unidadeResult = Unidade.create({
      redeId: input.redeId,
      nome: input.nome,
      cnes: input.cnes,
      cnpj: input.cnpj,
      telefone: input.telefone,
      email: input.email,
      endereco: input.endereco,
      timezone: input.timezone,
      observacoes: input.observacoes,
    });
    if (unidadeResult.isFailure) return Result.fail(unidadeResult.error);

    const unidade = unidadeResult.value;

    const nomeDuplicado = await this.unidadeRepository.existsByNome({
      redeId: input.redeId,
      nome: unidade.nome,
    });
    if (nomeDuplicado) {
      return Result.fail(new UnidadeNomeDuplicadoError({ nome: unidade.nome }));
    }

    if (unidade.cnes) {
      const cnesDuplicado = await this.unidadeRepository.existsByCnes({
        redeId: input.redeId,
        cnes: unidade.cnes,
      });
      if (cnesDuplicado) {
        return Result.fail(new Error(`Já existe uma unidade com o CNES ${unidade.cnes}`));
      }
    }

    await this.unidadeRepository.save(unidade);

    return Result.ok(this.mapper.map({ unidade }));
  }
}
