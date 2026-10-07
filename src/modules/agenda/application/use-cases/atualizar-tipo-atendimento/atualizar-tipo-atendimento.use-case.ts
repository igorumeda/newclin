import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TipoAtendimentoNaoEncontradoError } from '../../../domain/errors/tipo-atendimento-nao-encontrado.error';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import { TipoAtendimentoMapper } from '../../mappers/tipo-atendimento.mapper';
import type { TipoAtendimentoOutputDto } from '../../mappers/tipo-atendimento.output.dto';
import type { AtualizarTipoAtendimentoInputDto } from './atualizar-tipo-atendimento.input.dto';

export type AtualizarTipoAtendimentoDependencies = {
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  mapper: TipoAtendimentoMapper;
};

export class AtualizarTipoAtendimentoUseCase extends UseCase<
  AtualizarTipoAtendimentoInputDto,
  TipoAtendimentoOutputDto
> {
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: AtualizarTipoAtendimentoDependencies) {
    super();
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: AtualizarTipoAtendimentoInputDto,
  ): Promise<Result<TipoAtendimentoOutputDto>> {
    const tipoAtendimento = await this.tipoAtendimentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!tipoAtendimento) {
      return Result.fail(new TipoAtendimentoNaoEncontradoError({ tipoId: input.id }));
    }

    if (input.nome) {
      const duplicado = await this.tipoAtendimentoRepository.buscarPorNome({
        redeId: input.redeId,
        nome: input.nome,
        ignorarId: input.id,
      });
      if (duplicado) {
        return Result.fail(new Error('Já existe um tipo de atendimento com este nome'));
      }
    }

    const atualizacao = tipoAtendimento.atualizar({
      nome: input.nome,
      duracaoMinutos: input.duracaoMinutos,
      cor: input.cor,
      ativo: input.ativo,
    });
    if (atualizacao.isFailure) return Result.propagate(atualizacao);

    await this.tipoAtendimentoRepository.atualizar(tipoAtendimento);
    return Result.ok(this.mapper.map({ tipoAtendimento }));
  }
}
