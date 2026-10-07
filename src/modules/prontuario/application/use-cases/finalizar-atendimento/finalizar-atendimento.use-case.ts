import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AtendimentoNaoEncontradoError } from '../../../domain/errors/atendimento-nao-encontrado.error';
import type { IAtendimentoRepository } from '../../../domain/repositories/atendimento-repository.interface';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/template-repository.interface';
import { ValidadorPreenchimentoService } from '../../../domain/services/validador-preenchimento.service';
import { AtendimentoMapper } from '../../mappers/atendimento.mapper';
import type { AtendimentoOutputDto } from '../../mappers/atendimento.output.dto';
import type { FinalizarAtendimentoInputDto } from './finalizar-atendimento.input.dto';

export type FinalizarAtendimentoDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  templateRepository: ITemplateProntuarioRepository;
  validadorPreenchimento: ValidadorPreenchimentoService;
  mapper: AtendimentoMapper;
};

export class FinalizarAtendimentoUseCase extends UseCase<
  FinalizarAtendimentoInputDto,
  AtendimentoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly validadorPreenchimento: ValidadorPreenchimentoService;
  private readonly mapper: AtendimentoMapper;

  constructor(dependencies: FinalizarAtendimentoDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.validadorPreenchimento = dependencies.validadorPreenchimento;
    this.mapper = dependencies.mapper;
  }

  async execute(input: FinalizarAtendimentoInputDto): Promise<Result<AtendimentoOutputDto>> {
    const atendimento = await this.atendimentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!atendimento) {
      return Result.fail(new AtendimentoNaoEncontradoError({ atendimentoId: input.id }));
    }

    let dadosPreenchidos = input.dadosPreenchidos ?? {};
    if (atendimento.templateId) {
      const template = await this.templateRepository.buscarPorId({
        redeId: input.redeId,
        id: atendimento.templateId,
      });
      if (template) {
        const validacao = this.validadorPreenchimento.execute({
          estrutura: template.estrutura,
          dados: { ...atendimento.dadosPreenchidos, ...dadosPreenchidos },
          exigirObrigatorios: true,
        });
        if (validacao.isFailure) return Result.propagate(validacao);
        dadosPreenchidos = validacao.value.dados;
      }
    }

    const registro = atendimento.registrarDados({
      dadosPreenchidos,
      camposFixos: input.camposFixos,
      fontePagadora: input.fontePagadora,
    });
    if (registro.isFailure) return Result.propagate(registro);

    const finalizacao = atendimento.finalizar();
    if (finalizacao.isFailure) return Result.propagate(finalizacao);

    await this.atendimentoRepository.atualizar(atendimento);
    return Result.ok(this.mapper.map({ atendimento }));
  }
}
