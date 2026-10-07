import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TemplateNaoEncontradoError } from '../../../domain/errors/template-nao-encontrado.error';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import { TemplateMapper } from '../../mappers/template.mapper';
import type { TemplateOutputDto } from '../../mappers/template.output.dto';
import type { ObterTemplateInputDto } from './obter-template.input.dto';

export type ObterTemplateDependencies = {
  templateRepository: ITemplateProntuarioRepository;
  mapper: TemplateMapper;
};

export class ObterTemplateUseCase extends UseCase<ObterTemplateInputDto, TemplateOutputDto> {
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateMapper;

  constructor(dependencies: ObterTemplateDependencies) {
    super();
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterTemplateInputDto): Promise<Result<TemplateOutputDto>> {
    const template = await this.templateRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!template) return Result.fail(new TemplateNaoEncontradoError({ templateId: input.id }));
    return Result.ok(this.mapper.map({ template }));
  }
}
