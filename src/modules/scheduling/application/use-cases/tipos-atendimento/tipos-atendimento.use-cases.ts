import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { TipoAtendimento } from '../../../domain/entities/tipo-atendimento.entity';
import {
  TipoAtendimentoDuplicadoError,
  TipoAtendimentoNotFoundError,
} from '../../../domain/errors/agendamento.errors';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import { TipoAtendimentoMapper } from '../../mappers/agenda.mapper';
import type {
  AtualizarTipoAtendimentoInputDto,
  AtualizarTipoAtendimentoOutputDto,
  CriarTipoAtendimentoInputDto,
  CriarTipoAtendimentoOutputDto,
  InativarTipoAtendimentoInputDto,
  InativarTipoAtendimentoOutputDto,
  ListarTiposAtendimentoInputDto,
  ListarTiposAtendimentoOutputDto,
} from '../../dtos/agenda.dto';

export type TipoAtendimentoUseCasesDependencies = {
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  mapper: TipoAtendimentoMapper;
};

export class ListarTiposAtendimentoUseCase extends UseCase<
  ListarTiposAtendimentoInputDto,
  ListarTiposAtendimentoOutputDto
> {
  private readonly repository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: TipoAtendimentoUseCasesDependencies) {
    super();
    this.repository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: ListarTiposAtendimentoInputDto,
  ): Promise<Result<ListarTiposAtendimentoOutputDto>> {
    const tipos = await this.repository.listar({
      redeId: input.redeId,
      somenteAtivos: input.somenteAtivos ?? true,
      busca: input.busca ?? null,
    });

    return Result.ok({ items: tipos.map((tipo) => this.mapper.map({ tipo })) });
  }
}

export class CriarTipoAtendimentoUseCase extends UseCase<
  CriarTipoAtendimentoInputDto,
  CriarTipoAtendimentoOutputDto
> {
  private readonly repository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: TipoAtendimentoUseCasesDependencies) {
    super();
    this.repository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarTipoAtendimentoInputDto): Promise<Result<CriarTipoAtendimentoOutputDto>> {
    const tipoResult = TipoAtendimento.create(input);
    if (tipoResult.isFailure) return Result.fail(tipoResult.error);

    const tipo = tipoResult.value;
    const duplicado = await this.repository.existsByNome({ redeId: input.redeId, nome: tipo.nome });
    if (duplicado) return Result.fail(new TipoAtendimentoDuplicadoError({ nome: tipo.nome }));

    await this.repository.save(tipo);

    return Result.ok(this.mapper.map({ tipo }));
  }
}

export class AtualizarTipoAtendimentoUseCase extends UseCase<
  AtualizarTipoAtendimentoInputDto,
  AtualizarTipoAtendimentoOutputDto
> {
  private readonly repository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: TipoAtendimentoUseCasesDependencies) {
    super();
    this.repository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: AtualizarTipoAtendimentoInputDto,
  ): Promise<Result<AtualizarTipoAtendimentoOutputDto>> {
    const tipo = await this.repository.findById(input.tipoAtendimentoId);
    if (!tipo) {
      return Result.fail(new TipoAtendimentoNotFoundError({ tipoAtendimentoId: input.tipoAtendimentoId }));
    }

    if (input.nome && input.nome.trim().toLowerCase() !== tipo.nome.toLowerCase()) {
      const duplicado = await this.repository.existsByNome({
        redeId: tipo.redeId,
        nome: input.nome.trim(),
        ignorarId: input.tipoAtendimentoId,
      });
      if (duplicado) return Result.fail(new TipoAtendimentoDuplicadoError({ nome: input.nome }));
    }

    const atualizacao = tipo.atualizar({
      nome: input.nome,
      descricao: input.descricao,
      duracaoMinutos: input.duracaoMinutos,
      cor: input.cor,
      requerConfirmacao: input.requerConfirmacao,
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.repository.update(tipo);

    return Result.ok(this.mapper.map({ tipo }));
  }
}

export class InativarTipoAtendimentoUseCase extends UseCase<
  InativarTipoAtendimentoInputDto,
  InativarTipoAtendimentoOutputDto
> {
  private readonly repository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: TipoAtendimentoUseCasesDependencies) {
    super();
    this.repository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: InativarTipoAtendimentoInputDto,
  ): Promise<Result<InativarTipoAtendimentoOutputDto>> {
    const tipo = await this.repository.findById(input.tipoAtendimentoId);
    if (!tipo) {
      return Result.fail(new TipoAtendimentoNotFoundError({ tipoAtendimentoId: input.tipoAtendimentoId }));
    }

    const resultado = input.reativar ? tipo.reativar() : tipo.inativar();
    if (resultado.isFailure) return Result.fail(resultado.error);

    await this.repository.update(tipo);

    return Result.ok(this.mapper.map({ tipo }));
  }
}
