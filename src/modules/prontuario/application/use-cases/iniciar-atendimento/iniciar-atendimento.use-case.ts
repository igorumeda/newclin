import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Atendimento } from '../../../domain/entities/atendimento.entity';
import { TemplateNaoEncontradoError } from '../../../domain/errors/template-nao-encontrado.error';
import type { IAtendimentoRepository } from '../../../domain/repositories/atendimento-repository.interface';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import type { TemplateProntuario } from '../../../domain/entities/template-prontuario.entity';
import { AtendimentoMapper } from '../../mappers/atendimento.mapper';
import type { AtendimentoOutputDto } from '../../mappers/atendimento.output.dto';
import { TemplateMapper } from '../../mappers/template.mapper';
import type { TemplateOutputDto } from '../../mappers/template.output.dto';
import type { IniciarAtendimentoInputDto } from './iniciar-atendimento.input.dto';

export type IniciarAtendimentoDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  templateRepository: ITemplateProntuarioRepository;
  atendimentoMapper: AtendimentoMapper;
  templateMapper: TemplateMapper;
};

export type IniciarAtendimentoOutputDto = {
  atendimento: AtendimentoOutputDto;
  template: TemplateOutputDto | null;
  reaberto: boolean;
};

export class IniciarAtendimentoUseCase extends UseCase<
  IniciarAtendimentoInputDto,
  IniciarAtendimentoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly atendimentoMapper: AtendimentoMapper;
  private readonly templateMapper: TemplateMapper;

  constructor(dependencies: IniciarAtendimentoDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.atendimentoMapper = dependencies.atendimentoMapper;
    this.templateMapper = dependencies.templateMapper;
  }

  async execute(input: IniciarAtendimentoInputDto): Promise<Result<IniciarAtendimentoOutputDto>> {
    if (input.agendamentoId) {
      const existente = await this.atendimentoRepository.buscarPorAgendamento({
        redeId: input.redeId,
        agendamentoId: input.agendamentoId,
      });
      if (existente) {
        const templateExistente = existente.templateId
          ? await this.templateRepository.buscarPorId({
              redeId: input.redeId,
              id: existente.templateId,
            })
          : null;
        return Result.ok({
          atendimento: this.atendimentoMapper.map({ atendimento: existente }),
          template: templateExistente
            ? this.templateMapper.map({ template: templateExistente })
            : null,
          reaberto: true,
        });
      }
    }

    const templateResult = await this.resolverTemplate(input);
    if (templateResult.isFailure) return Result.propagate(templateResult);
    const template = templateResult.value;

    const atendimentoResult = Atendimento.iniciar({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      agendamentoId: input.agendamentoId ?? null,
      pacienteId: input.pacienteId,
      profissionalId: input.profissionalId,
      templateId: template?.id.toString() ?? null,
      templateVersao: template?.versao ?? null,
      fontePagadora: input.fontePagadora,
    });
    if (atendimentoResult.isFailure) return Result.propagate(atendimentoResult);

    await this.atendimentoRepository.salvar(atendimentoResult.value);

    return Result.ok({
      atendimento: this.atendimentoMapper.map({ atendimento: atendimentoResult.value }),
      template: template ? this.templateMapper.map({ template }) : null,
      reaberto: false,
    });
  }

  private async resolverTemplate(
    input: IniciarAtendimentoInputDto,
  ): Promise<Result<TemplateProntuario | null>> {
    if (input.templateId) {
      const template = await this.templateRepository.buscarPorId({
        redeId: input.redeId,
        id: input.templateId,
      });
      if (!template) {
        return Result.fail(new TemplateNaoEncontradoError({ templateId: input.templateId }));
      }
      return Result.ok(template);
    }
    if (input.especialidade) {
      const padrao = await this.templateRepository.buscarPadraoPorEspecialidade({
        redeId: input.redeId,
        especialidade: input.especialidade,
      });
      return Result.ok(padrao);
    }
    return Result.ok(null);
  }
}
