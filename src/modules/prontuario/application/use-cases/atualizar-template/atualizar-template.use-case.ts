import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TemplateNaoEncontradoError } from '../../../domain/errors/template-nao-encontrado.error';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import { TemplateMapper } from '../../mappers/template.mapper';
import type { TemplateOutputDto } from '../../mappers/template.output.dto';
import type { AtualizarTemplateInputDto } from './atualizar-template.input.dto';

export type AtualizarTemplateDependencies = {
  templateRepository: ITemplateProntuarioRepository;
  mapper: TemplateMapper;
};

export class AtualizarTemplateUseCase extends UseCase<
  AtualizarTemplateInputDto,
  TemplateOutputDto
> {
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateMapper;

  constructor(dependencies: AtualizarTemplateDependencies) {
    super();
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarTemplateInputDto): Promise<Result<TemplateOutputDto>> {
    const template = await this.templateRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!template) return Result.fail(new TemplateNaoEncontradoError({ templateId: input.id }));

    const atualizacao = template.atualizar({
      nome: input.nome,
      especialidade: input.especialidade,
      descricao: input.descricao,
      padrao: input.padrao,
      ativo: input.ativo,
      secoes: input.secoes,
    });
    if (atualizacao.isFailure) return Result.propagate(atualizacao);

    await this.templateRepository.atualizar(template);
    return Result.ok(this.mapper.map({ template }));
  }
}
