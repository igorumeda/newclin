import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import { TemplateMapper } from '../../mappers/template.mapper';
import type { TemplateOutputDto } from '../../mappers/template.output.dto';
import type { ListarTemplatesInputDto } from './listar-templates.input.dto';

export type ListarTemplatesDependencies = {
  templateRepository: ITemplateProntuarioRepository;
  mapper: TemplateMapper;
};

export class ListarTemplatesUseCase extends UseCase<ListarTemplatesInputDto, TemplateOutputDto[]> {
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateMapper;

  constructor(dependencies: ListarTemplatesDependencies) {
    super();
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarTemplatesInputDto): Promise<Result<TemplateOutputDto[]>> {
    const templates = await this.templateRepository.listar({
      redeId: input.redeId,
      especialidade: input.especialidade ?? null,
      apenasAtivos: input.apenasAtivos,
    });
    return Result.ok(templates.map((template) => this.mapper.map({ template })));
  }
}
