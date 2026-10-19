import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { BloqueioAgenda } from '../../../domain/entities/bloqueio-agenda.entity';
import { BloqueioNotFoundError } from '../../../domain/errors/agendamento.errors';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IProfissionalLookup } from '@/modules/professional/domain/services/profissional-lookup.interface';
import { BloqueioAgendaMapper } from '../../mappers/agenda.mapper';
import type {
  CriarBloqueioInputDto,
  CriarBloqueioOutputDto,
  ListarBloqueiosInputDto,
  ListarBloqueiosOutputDto,
  RemoverBloqueioInputDto,
  RemoverBloqueioOutputDto,
} from '../../dtos/agenda.dto';

export type BloqueioUseCasesDependencies = {
  bloqueioRepository: IBloqueioAgendaRepository;
  unidadeLookup: IUnidadeLookup;
  profissionalLookup: IProfissionalLookup;
  mapper: BloqueioAgendaMapper;
};

export class ListarBloqueiosUseCase extends UseCase<
  ListarBloqueiosInputDto,
  ListarBloqueiosOutputDto
> {
  private readonly repository: IBloqueioAgendaRepository;
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly profissionalLookup: IProfissionalLookup;
  private readonly mapper: BloqueioAgendaMapper;

  constructor(dependencies: BloqueioUseCasesDependencies) {
    super();
    this.repository = dependencies.bloqueioRepository;
    this.unidadeLookup = dependencies.unidadeLookup;
    this.profissionalLookup = dependencies.profissionalLookup;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarBloqueiosInputDto): Promise<Result<ListarBloqueiosOutputDto>> {
    const bloqueios = await this.repository.listar({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: input.profissionalId ?? null,
      de: input.de,
      ate: input.ate,
      somenteAtivos: input.somenteAtivos ?? true,
    });

    const unidades = new Map(
      (await this.unidadeLookup.listarAtivas(input.redeId)).map((unidade) => [unidade.id, unidade.nome]),
    );

    const nomesProfissionais = new Map<string, string>();
    for (const profissionalId of [...new Set(bloqueios.map((item) => item.profissionalId))]) {
      const profissional = await this.profissionalLookup.findById(profissionalId);
      nomesProfissionais.set(profissionalId, profissional?.nome ?? '');
    }

    return Result.ok({
      items: bloqueios.map((bloqueio) =>
        this.mapper.map({
          bloqueio,
          unidadeNome: unidades.get(bloqueio.unidadeId) ?? null,
          profissionalNome: nomesProfissionais.get(bloqueio.profissionalId) ?? null,
        }),
      ),
    });
  }
}

export class CriarBloqueioUseCase extends UseCase<CriarBloqueioInputDto, CriarBloqueioOutputDto> {
  private readonly repository: IBloqueioAgendaRepository;
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly profissionalLookup: IProfissionalLookup;
  private readonly mapper: BloqueioAgendaMapper;

  constructor(dependencies: BloqueioUseCasesDependencies) {
    super();
    this.repository = dependencies.bloqueioRepository;
    this.unidadeLookup = dependencies.unidadeLookup;
    this.profissionalLookup = dependencies.profissionalLookup;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarBloqueioInputDto): Promise<Result<CriarBloqueioOutputDto>> {
    const bloqueioResult = BloqueioAgenda.create(input);
    if (bloqueioResult.isFailure) return Result.fail(bloqueioResult.error);

    const bloqueio = bloqueioResult.value;
    await this.repository.save(bloqueio);

    const [unidade, profissional] = await Promise.all([
      this.unidadeLookup.findById(bloqueio.unidadeId),
      this.profissionalLookup.findById(bloqueio.profissionalId),
    ]);

    return Result.ok(
      this.mapper.map({
        bloqueio,
        unidadeNome: unidade?.nome ?? null,
        profissionalNome: profissional?.nome ?? null,
      }),
    );
  }
}

export class RemoverBloqueioUseCase extends UseCase<
  RemoverBloqueioInputDto,
  RemoverBloqueioOutputDto
> {
  private readonly repository: IBloqueioAgendaRepository;

  constructor(dependencies: BloqueioUseCasesDependencies) {
    super();
    this.repository = dependencies.bloqueioRepository;
  }

  async execute(input: RemoverBloqueioInputDto): Promise<Result<RemoverBloqueioOutputDto>> {
    const bloqueio = await this.repository.findById(input.bloqueioId);
    if (!bloqueio) return Result.fail(new BloqueioNotFoundError({ bloqueioId: input.bloqueioId }));

    const remocao = bloqueio.remover();
    if (remocao.isFailure) return Result.fail(remocao.error);

    await this.repository.update(bloqueio);

    return Result.ok({ bloqueioId: input.bloqueioId });
  }
}
