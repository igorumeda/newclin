import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ModeloMensagem } from '../../../domain/entities/modelo-mensagem.entity';
import type { IModeloMensagemRepository } from '../../../domain/repositories/modelo-mensagem-repository.interface';
import { ModeloMensagemMapper } from '../../mappers/notificacao.mapper';
import type {
  SalvarModeloMensagemInputDto,
  SalvarModeloMensagemOutputDto,
} from '../../dtos/notificacao.dto';

export type SalvarModeloMensagemDependencies = {
  modeloMensagemRepository: IModeloMensagemRepository;
  mapper: ModeloMensagemMapper;
};

/**
 * Edição dos modelos de mensagem da rede (§4.1) — cria quando não existe e
 * atualiza o existente (um modelo por canal + tipo, garantido por índice único).
 */
export class SalvarModeloMensagemUseCase extends UseCase<
  SalvarModeloMensagemInputDto,
  SalvarModeloMensagemOutputDto
> {
  private readonly modeloMensagemRepository: IModeloMensagemRepository;
  private readonly mapper: ModeloMensagemMapper;

  constructor(dependencies: SalvarModeloMensagemDependencies) {
    super();
    this.modeloMensagemRepository = dependencies.modeloMensagemRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: SalvarModeloMensagemInputDto,
  ): Promise<Result<SalvarModeloMensagemOutputDto>> {
    const existente = await this.modeloMensagemRepository.buscarAtivo({
      redeId: input.redeId,
      canal: input.canal,
      tipo: input.tipo,
    });

    if (existente) {
      const atualizacao = existente.atualizar({
        assunto: input.assunto,
        corpo: input.corpo,
        ativo: input.ativo,
      });
      if (atualizacao.isFailure) return Result.fail(atualizacao.error);

      await this.modeloMensagemRepository.update(existente);
      return Result.ok(this.mapper.map({ modelo: existente }));
    }

    const modeloResult = ModeloMensagem.create({
      redeId: input.redeId,
      canal: input.canal,
      tipo: input.tipo,
      assunto: input.assunto,
      corpo: input.corpo,
      ativo: input.ativo,
    });
    if (modeloResult.isFailure) return Result.fail(modeloResult.error);

    await this.modeloMensagemRepository.save(modeloResult.value);

    return Result.ok(this.mapper.map({ modelo: modeloResult.value }));
  }
}
