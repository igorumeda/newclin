import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TemplateProntuario } from '../../../domain/entities/template-prontuario.entity';
import {
  TemplateDuplicadoError,
  TemplateNotFoundError,
} from '../../../domain/errors/prontuario.errors';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/prontuario-repositories.interface';
import { TemplateProntuarioMapper } from '../../mappers/prontuario.mapper';
import type {
  AtualizarTemplateInputDto,
  AtualizarTemplateOutputDto,
  ClonarTemplateInputDto,
  ClonarTemplateOutputDto,
  CriarTemplateInputDto,
  CriarTemplateOutputDto,
  InativarTemplateInputDto,
  InativarTemplateOutputDto,
  ListarTemplatesInputDto,
  ListarTemplatesOutputDto,
  ObterTemplateInputDto,
  ObterTemplateOutputDto,
} from '../../dtos/prontuario.dto';

export type TemplateUseCasesDependencies = {
  templateRepository: ITemplateProntuarioRepository;
  mapper: TemplateProntuarioMapper;
};

export class ListarTemplatesUseCase extends UseCase<ListarTemplatesInputDto, ListarTemplatesOutputDto> {
  private readonly repository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateProntuarioMapper;

  constructor(dependencies: TemplateUseCasesDependencies) {
    super();
    this.repository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarTemplatesInputDto): Promise<Result<ListarTemplatesOutputDto>> {
    const [templates, especialidades] = await Promise.all([
      this.repository.listar({
        redeId: input.redeId,
        especialidade: input.especialidade ?? null,
        busca: input.busca ?? null,
        somenteAtivos: input.somenteAtivos ?? true,
      }),
      this.repository.listarEspecialidades(input.redeId),
    ]);

    return Result.ok({
      items: templates.map((template) => this.mapper.map({ template })),
      especialidades,
    });
  }
}

export class ObterTemplateUseCase extends UseCase<ObterTemplateInputDto, ObterTemplateOutputDto> {
  private readonly repository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateProntuarioMapper;

  constructor(dependencies: TemplateUseCasesDependencies) {
    super();
    this.repository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterTemplateInputDto): Promise<Result<ObterTemplateOutputDto>> {
    const template = await this.repository.findById(input.templateId);
    if (!template) return Result.fail(new TemplateNotFoundError({ templateId: input.templateId }));

    return Result.ok(this.mapper.map({ template }));
  }
}

export class CriarTemplateUseCase extends UseCase<CriarTemplateInputDto, CriarTemplateOutputDto> {
  private readonly repository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateProntuarioMapper;

  constructor(dependencies: TemplateUseCasesDependencies) {
    super();
    this.repository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarTemplateInputDto): Promise<Result<CriarTemplateOutputDto>> {
    const templateResult = TemplateProntuario.create(input);
    if (templateResult.isFailure) return Result.fail(templateResult.error);

    const template = templateResult.value;

    const duplicado = await this.repository.existsByNome({ redeId: input.redeId, nome: template.nome });
    if (duplicado) return Result.fail(new TemplateDuplicadoError({ nome: template.nome }));

    await this.repository.save(template);

    return Result.ok(this.mapper.map({ template }));
  }
}

export class ClonarTemplateUseCase extends UseCase<ClonarTemplateInputDto, ClonarTemplateOutputDto> {
  private readonly repository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateProntuarioMapper;

  constructor(dependencies: TemplateUseCasesDependencies) {
    super();
    this.repository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ClonarTemplateInputDto): Promise<Result<ClonarTemplateOutputDto>> {
    const origem = await this.repository.findById(input.templateId);
    if (!origem) return Result.fail(new TemplateNotFoundError({ templateId: input.templateId }));

    const cloneResult = TemplateProntuario.clonar({
      origem,
      redeId: input.redeId,
      nome: input.nome,
      especialidade: input.especialidade,
      createdBy: input.createdBy,
    });
    if (cloneResult.isFailure) return Result.fail(cloneResult.error);

    const clone = cloneResult.value;

    const duplicado = await this.repository.existsByNome({ redeId: input.redeId, nome: clone.nome });
    if (duplicado) return Result.fail(new TemplateDuplicadoError({ nome: clone.nome }));

    await this.repository.save(clone);

    return Result.ok(this.mapper.map({ template: clone }));
  }
}

export class AtualizarTemplateUseCase extends UseCase<
  AtualizarTemplateInputDto,
  AtualizarTemplateOutputDto
> {
  private readonly repository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateProntuarioMapper;

  constructor(dependencies: TemplateUseCasesDependencies) {
    super();
    this.repository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarTemplateInputDto): Promise<Result<AtualizarTemplateOutputDto>> {
    const template = await this.repository.findById(input.templateId);
    if (!template) return Result.fail(new TemplateNotFoundError({ templateId: input.templateId }));

    if (input.nome && input.nome.trim().toLowerCase() !== template.nome.toLowerCase()) {
      const duplicado = await this.repository.existsByNome({
        redeId: template.redeId,
        nome: input.nome.trim(),
        ignorarId: input.templateId,
      });
      if (duplicado) return Result.fail(new TemplateDuplicadoError({ nome: input.nome }));
    }

    const atualizacao = template.atualizarDados({
      nome: input.nome,
      especialidade: input.especialidade,
      descricao: input.descricao,
      secoes: input.secoes,
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.repository.update(template);

    return Result.ok(this.mapper.map({ template }));
  }
}

export class InativarTemplateUseCase extends UseCase<
  InativarTemplateInputDto,
  InativarTemplateOutputDto
> {
  private readonly repository: ITemplateProntuarioRepository;
  private readonly mapper: TemplateProntuarioMapper;

  constructor(dependencies: TemplateUseCasesDependencies) {
    super();
    this.repository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: InativarTemplateInputDto): Promise<Result<InativarTemplateOutputDto>> {
    const template = await this.repository.findById(input.templateId);
    if (!template) return Result.fail(new TemplateNotFoundError({ templateId: input.templateId }));

    const resultado = input.reativar ? template.reativar() : template.inativar();
    if (resultado.isFailure) return Result.fail(resultado.error);

    await this.repository.update(template);

    return Result.ok(this.mapper.map({ template }));
  }
}
