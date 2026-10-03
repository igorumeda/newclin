import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Anexo } from '../../../domain/entities/anexo.entity';
import { AnexoNotFoundError } from '../../../domain/errors/prontuario.errors';
import type { IAnexoRepository } from '../../../domain/repositories/prontuario-repositories.interface';
import type { IAnexoStorage } from '../../../domain/services/anexo-storage.interface';
import type { AnexoMapper } from '../../mappers/prontuario.mapper';
import type {
  AnexoDto,
  EnviarAnexoInputDto,
  EnviarAnexoOutputDto,
  ListarAnexosInputDto,
  ListarAnexosOutputDto,
  ObterLinkAnexoInputDto,
  ObterLinkAnexoOutputDto,
  RemoverAnexoInputDto,
  RemoverAnexoOutputDto,
} from '../../dtos/prontuario.dto';

export type AnexoUseCasesDependencies = {
  anexoRepository: IAnexoRepository;
  storage: IAnexoStorage;
  mapper: AnexoMapper;
};

const EXPIRACAO_PADRAO_SEGUNDOS = 60 * 15;

/**
 * Envio de anexos (§3.5): limite de 10 MB, PDF/JPG/PNG e bucket privado.
 * O caminho segue o padrão `anexos/{rede_id}/{paciente_id}/{anexo_id}.{ext}`.
 */
export class EnviarAnexoUseCase extends UseCase<EnviarAnexoInputDto, EnviarAnexoOutputDto> {
  private readonly repository: IAnexoRepository;
  private readonly storage: IAnexoStorage;
  private readonly mapper: AnexoMapper;

  constructor(dependencies: AnexoUseCasesDependencies) {
    super();
    this.repository = dependencies.anexoRepository;
    this.storage = dependencies.storage;
    this.mapper = dependencies.mapper;
  }

  async execute(input: EnviarAnexoInputDto): Promise<Result<EnviarAnexoOutputDto>> {
    const conteudo = this.decodificar(input.conteudoBase64);
    if (conteudo.isFailure) return Result.fail(conteudo.error);

    const anexoId = crypto.randomUUID();
    const extensao = this.extensao(input.mimeType);

    const caminho = Anexo.montarCaminho({
      redeId: input.redeId,
      pacienteId: input.pacienteId,
      anexoId,
      extensao,
    });

    const anexoResult = Anexo.create({
      id: anexoId,
      redeId: input.redeId,
      pacienteId: input.pacienteId,
      atendimentoId: input.atendimentoId ?? null,
      nomeArquivo: input.nomeArquivo,
      descricao: input.descricao ?? null,
      mimeType: input.mimeType,
      tamanhoBytes: conteudo.value.byteLength,
      storageBucket: 'anexos',
      storagePath: caminho,
      uploadedBy: input.uploadedBy ?? null,
    });
    if (anexoResult.isFailure) return Result.fail(anexoResult.error);

    const anexo = anexoResult.value;

    await this.storage.upload({
      caminho,
      conteudo: conteudo.value,
      mimeType: input.mimeType,
    });

    await this.repository.save(anexo);

    const urlAssinada = await this.storage.urlAssinada({ caminho });

    return Result.ok(this.mapper.map({ anexo, urlAssinada }));
  }

  private decodificar(base64: string): Result<Uint8Array> {
    try {
      const limpo = base64.includes(',') ? base64.split(',').pop() ?? '' : base64;
      const binario = Buffer.from(limpo, 'base64');
      return Result.ok(new Uint8Array(binario));
    } catch {
      return Result.fail(new Error('Não foi possível ler o arquivo enviado'));
    }
  }

  private extensao(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'image/png') return 'png';
    return 'jpg';
  }
}

export class ListarAnexosUseCase extends UseCase<ListarAnexosInputDto, ListarAnexosOutputDto> {
  private readonly repository: IAnexoRepository;
  private readonly storage: IAnexoStorage;
  private readonly mapper: AnexoMapper;

  constructor(dependencies: AnexoUseCasesDependencies) {
    super();
    this.repository = dependencies.anexoRepository;
    this.storage = dependencies.storage;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarAnexosInputDto): Promise<Result<ListarAnexosOutputDto>> {
    const anexos = await this.repository.listar({
      redeId: input.redeId,
      pacienteId: input.pacienteId ?? null,
      atendimentoId: input.atendimentoId ?? null,
    });

    // URLs assinadas e expiráveis (§4.3) — nunca o caminho público do bucket.
    const items = await Promise.all(
      anexos.map(async (anexo) => {
        const url = await this.storage.urlAssinada({ caminho: anexo.storagePath });
        return this.mapper.map({ anexo, urlAssinada: url });
      }),
    );

    return Result.ok({ items });
  }
}

export class ObterLinkAnexoUseCase extends UseCase<ObterLinkAnexoInputDto, ObterLinkAnexoOutputDto> {
  private readonly repository: IAnexoRepository;
  private readonly storage: IAnexoStorage;

  constructor(dependencies: AnexoUseCasesDependencies) {
    super();
    this.repository = dependencies.anexoRepository;
    this.storage = dependencies.storage;
  }

  async execute(input: ObterLinkAnexoInputDto): Promise<Result<ObterLinkAnexoOutputDto>> {
    const anexo = await this.repository.findById(input.anexoId);
    if (!anexo) return Result.fail(new AnexoNotFoundError({ anexoId: input.anexoId }));

    const expiraEmSegundos = input.expiraEmSegundos ?? EXPIRACAO_PADRAO_SEGUNDOS;
    const url = await this.storage.urlAssinada({ caminho: anexo.storagePath, expiraEmSegundos });

    return Result.ok({
      anexoId: anexo.id.toString(),
      url,
      expiraEm: new Date(Date.now() + expiraEmSegundos * 1000).toISOString(),
    });
  }
}

export class RemoverAnexoUseCase extends UseCase<RemoverAnexoInputDto, RemoverAnexoOutputDto> {
  private readonly repository: IAnexoRepository;
  private readonly storage: IAnexoStorage;

  constructor(dependencies: AnexoUseCasesDependencies) {
    super();
    this.repository = dependencies.anexoRepository;
    this.storage = dependencies.storage;
  }

  async execute(input: RemoverAnexoInputDto): Promise<Result<RemoverAnexoOutputDto>> {
    const anexo = await this.repository.findById(input.anexoId);
    if (!anexo) return Result.fail(new AnexoNotFoundError({ anexoId: input.anexoId }));

    await this.repository.softDelete(input.anexoId);
    await this.storage.remover({ caminho: anexo.storagePath });

    return Result.ok({ anexoId: input.anexoId });
  }
}

export type { AnexoDto };
