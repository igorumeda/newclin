import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AtendimentoNaoEncontradoError } from '../../../domain/errors/atendimento-nao-encontrado.error';
import type { IAnexoRepository } from '../../../domain/repositories/anexo-repository.interface';
import type { IAtendimentoRepository } from '../../../domain/repositories/atendimento-repository.interface';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import { AdendoMapper } from '../../mappers/adendo.mapper';
import { AnexoMapper } from '../../mappers/anexo.mapper';
import type { AnexoOutputDto } from '../../mappers/anexo.output.dto';
import { AtendimentoMapper } from '../../mappers/atendimento.mapper';
import type { AdendoOutputDto, AtendimentoOutputDto } from '../../mappers/atendimento.output.dto';
import { TemplateMapper } from '../../mappers/template.mapper';
import type { TemplateOutputDto } from '../../mappers/template.output.dto';
import type { ObterAtendimentoInputDto } from './obter-atendimento.input.dto';

export type ObterAtendimentoDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  templateRepository: ITemplateProntuarioRepository;
  anexoRepository: IAnexoRepository;
  atendimentoMapper: AtendimentoMapper;
  templateMapper: TemplateMapper;
  adendoMapper: AdendoMapper;
  anexoMapper: AnexoMapper;
};

export type ObterAtendimentoOutputDto = {
  atendimento: AtendimentoOutputDto;
  template: TemplateOutputDto | null;
  adendos: AdendoOutputDto[];
  anexos: AnexoOutputDto[];
};

export class ObterAtendimentoUseCase extends UseCase<
  ObterAtendimentoInputDto,
  ObterAtendimentoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly anexoRepository: IAnexoRepository;
  private readonly atendimentoMapper: AtendimentoMapper;
  private readonly templateMapper: TemplateMapper;
  private readonly adendoMapper: AdendoMapper;
  private readonly anexoMapper: AnexoMapper;

  constructor(dependencies: ObterAtendimentoDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.anexoRepository = dependencies.anexoRepository;
    this.atendimentoMapper = dependencies.atendimentoMapper;
    this.templateMapper = dependencies.templateMapper;
    this.adendoMapper = dependencies.adendoMapper;
    this.anexoMapper = dependencies.anexoMapper;
  }

  async execute(input: ObterAtendimentoInputDto): Promise<Result<ObterAtendimentoOutputDto>> {
    const atendimento = await this.atendimentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!atendimento) {
      return Result.fail(new AtendimentoNaoEncontradoError({ atendimentoId: input.id }));
    }

    const [template, adendos, anexos] = await Promise.all([
      atendimento.templateId
        ? this.templateRepository.buscarPorId({
            redeId: input.redeId,
            id: atendimento.templateId,
          })
        : Promise.resolve(null),
      this.atendimentoRepository.listarAdendos({
        redeId: input.redeId,
        atendimentoId: input.id,
      }),
      this.anexoRepository.listar({ redeId: input.redeId, atendimentoId: input.id }),
    ]);

    return Result.ok({
      atendimento: this.atendimentoMapper.map({ atendimento }),
      template: template ? this.templateMapper.map({ template }) : null,
      adendos: adendos.map((adendo) => this.adendoMapper.map({ adendo })),
      anexos: anexos.map((anexo) => this.anexoMapper.map({ anexo })),
    });
  }
}
