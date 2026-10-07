import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TemplateProntuario } from '../../../domain/entities/template-prontuario.entity';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import { TemplateMapper } from '../../mappers/template.mapper';
import type { TemplateOutputDto } from '../../mappers/template.output.dto';
import type { CriarTemplateInputDto } from './criar-template.input.dto';

export type CriarTemplateDependencies = {
  templateRepository: ITemplateProntuarioRepository;
  mapper: TemplateMapper;
};

export class CriarTemplateUseCase extends UseCase<CriarTemplateInputDto, TemplateOutputDto> {
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateMapper;

  constructor(dependencies: CriarTemplateDependencies) {
    super();
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarTemplateInputDto): Promise<Result<TemplateOutputDto>> {
    const templateResult = TemplateProntuario.create({
      redeId: input.redeId,
      nome: input.nome,
      especialidade: input.especialidade,
      descricao: input.descricao,
      padrao: input.padrao,
      secoes: input.secoes,
    });
    if (templateResult.isFailure) return Result.propagate(templateResult);

    await this.templateRepository.salvar(templateResult.value);
    return Result.ok(this.mapper.map({ template: templateResult.value }));
  }
}
