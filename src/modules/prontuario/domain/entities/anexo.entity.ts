import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { AnexoInvalidoError } from '../errors/anexo-invalido.error';

export const MIMES_ANEXO_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const TAMANHO_MAXIMO_ANEXO_BYTES = 10 * 1024 * 1024;

export type AnexoProps = {
  redeId: string;
  pacienteId: string;
  atendimentoId: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageKey: string;
  descricao: string | null;
  enviadoPor: string | null;
};

export type AnexoConstructorParams = EntityConstructorParams<AnexoProps>;
export type ReconstituirAnexoParams = AnexoConstructorParams & {
  id: NonNullable<AnexoConstructorParams['id']>;
};
export type CriarAnexoParams = {
  redeId: string;
  pacienteId: string;
  atendimentoId?: string | null;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  storageKey: string;
  descricao?: string | null;
  enviadoPor?: string | null;
};
export type ValidarArquivoParams = { mimeType: string; tamanhoBytes: number };

export class Anexo extends Entity<AnexoProps> {
  private constructor(params: AnexoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get pacienteId(): string {
    return this.props.pacienteId;
  }

  get atendimentoId(): string | null {
    return this.props.atendimentoId;
  }

  get nomeArquivo(): string {
    return this.props.nomeArquivo;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get tamanhoBytes(): number {
    return this.props.tamanhoBytes;
  }

  get storageKey(): string {
    return this.props.storageKey;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get enviadoPor(): string | null {
    return this.props.enviadoPor;
  }

  /** Regra reutilizada no cliente antes do upload (isomorfismo). */
  public static validarArquivo(params: ValidarArquivoParams): Result<void> {
    if (!MIMES_ANEXO_PERMITIDOS.includes(params.mimeType as (typeof MIMES_ANEXO_PERMITIDOS)[number])) {
      return Result.fail(
        new AnexoInvalidoError({ motivo: 'Formato não permitido. Envie PDF, JPG ou PNG.' }),
      );
    }
    if (params.tamanhoBytes <= 0) {
      return Result.fail(new AnexoInvalidoError({ motivo: 'Arquivo vazio' }));
    }
    if (params.tamanhoBytes > TAMANHO_MAXIMO_ANEXO_BYTES) {
      return Result.fail(new AnexoInvalidoError({ motivo: 'O arquivo excede o limite de 10 MB' }));
    }
    return Result.ok();
  }

  public static create(params: CriarAnexoParams): Result<Anexo> {
    const validacao = Anexo.validarArquivo({
      mimeType: params.mimeType,
      tamanhoBytes: params.tamanhoBytes,
    });
    if (validacao.isFailure) return Result.propagate(validacao);

    if (!params.nomeArquivo?.trim()) {
      return Result.fail(new AnexoInvalidoError({ motivo: 'Informe o nome do arquivo' }));
    }
    if (!params.storageKey?.trim()) {
      return Result.fail(new AnexoInvalidoError({ motivo: 'Chave de armazenamento ausente' }));
    }

    return Result.ok(
      new Anexo({
        props: {
          redeId: params.redeId,
          pacienteId: params.pacienteId,
          atendimentoId: params.atendimentoId ?? null,
          nomeArquivo: params.nomeArquivo.trim(),
          mimeType: params.mimeType,
          tamanhoBytes: params.tamanhoBytes,
          storageKey: params.storageKey.trim(),
          descricao: params.descricao?.trim() || null,
          enviadoPor: params.enviadoPor ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirAnexoParams): Anexo {
    return new Anexo(params);
  }
}
