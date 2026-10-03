import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ALLOWED_LOGO_MIME_TYPES } from '@/shared/constants/upload.constants';
import { RedeNotFoundError } from '../../../domain/errors/unidade.errors';
import type { IRedeRepository } from '../../../domain/repositories/rede-repository.interface';
import type { ILogoStorageProvider } from '../../../domain/services/logo-storage.interface';
import type { DefinirLogotipoInputDto, DefinirLogotipoOutputDto } from '../../dtos/organizacao.dto';

export type DefinirLogotipoDependencies = {
  redeRepository: IRedeRepository;
  logoStorage: ILogoStorageProvider;
  maxUploadSizeBytes: number;
  signedUrlTtlSeconds: number;
};

const MIME_EXTENSAO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
};

/** Upload do logotipo da rede (§3.7), exibido na sidebar e nos documentos. */
export class DefinirLogotipoUseCase extends UseCase<DefinirLogotipoInputDto, DefinirLogotipoOutputDto> {
  private readonly redeRepository: IRedeRepository;
  private readonly logoStorage: ILogoStorageProvider;
  private readonly maxUploadSizeBytes: number;
  private readonly signedUrlTtlSeconds: number;

  constructor(dependencies: DefinirLogotipoDependencies) {
    super();
    this.redeRepository = dependencies.redeRepository;
    this.logoStorage = dependencies.logoStorage;
    this.maxUploadSizeBytes = dependencies.maxUploadSizeBytes;
    this.signedUrlTtlSeconds = dependencies.signedUrlTtlSeconds;
  }

  async execute(input: DefinirLogotipoInputDto): Promise<Result<DefinirLogotipoOutputDto>> {
    const rede = await this.redeRepository.findById(input.redeId);
    if (!rede) return Result.fail(new RedeNotFoundError({ redeId: input.redeId }));

    if (input.remover || !input.arquivo) {
      if (rede.logotipoPath) {
        await this.logoStorage.remove({ path: rede.logotipoPath });
      }
      rede.definirLogotipo({ url: null, path: null });
      await this.redeRepository.update(rede);
      return Result.ok({ logotipoUrl: null, logotipoPath: null });
    }

    const arquivo = input.arquivo;

    if (!ALLOWED_LOGO_MIME_TYPES.includes(arquivo.mimeType as (typeof ALLOWED_LOGO_MIME_TYPES)[number])) {
      return Result.fail(new Error('Formato inválido: envie uma imagem PNG, JPG ou SVG'));
    }
    if (arquivo.tamanhoBytes > this.maxUploadSizeBytes) {
      return Result.fail(
        new Error(`Arquivo excede o limite de ${Math.round(this.maxUploadSizeBytes / 1024 / 1024)} MB`),
      );
    }

    const extensao = MIME_EXTENSAO[arquivo.mimeType] ?? 'png';
    const path = `${input.redeId}/logotipo-${Date.now()}.${extensao}`;

    await this.logoStorage.upload({
      path,
      conteudo: arquivo.conteudo,
      mimeType: arquivo.mimeType,
    });

    if (rede.logotipoPath && rede.logotipoPath !== path) {
      await this.logoStorage.remove({ path: rede.logotipoPath });
    }

    const url = this.logoStorage.publicUrl({ path });
    rede.definirLogotipo({ url, path });
    await this.redeRepository.update(rede);

    return Result.ok({ logotipoUrl: url, logotipoPath: path });
  }
}
