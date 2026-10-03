import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Identifier } from '@core/domain/identifier';
import { Result } from '@core/domain/result';
import { AnexoInvalidoError } from '../errors/prontuario.errors';

export type AnexoProps = {
  redeId: string;
  pacienteId: string | null;
  atendimentoId: string | null;
  nomeArquivo: string;
  descricao: string | null;
  mimeType: string;
  tamanhoBytes: number;
  storageBucket: string;
  storagePath: string;
  uploadedBy: string | null;
};

export type AnexoConstructorParams = EntityConstructorParams<AnexoProps>;

export type CreateAnexoParams = {
  /** Identificador pré-gerado — mantém o mesmo id no banco e no storage. */
  id?: string;
  redeId: string;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  nomeArquivo: string;
  descricao?: string | null;
  mimeType: string;
  tamanhoBytes: number;
  storageBucket: string;
  storagePath: string;
  uploadedBy?: string | null;
};

export const MIME_TYPES_ANEXO = ['application/pdf', 'image/jpeg', 'image/png'];
export const TAMANHO_MAXIMO_ANEXO_BYTES = 10 * 1024 * 1024;

/**
 * Metadados de um anexo do prontuário (§3.5). O arquivo vive no Supabase
 * Storage; o banco guarda bucket, caminho e validações de tipo/tamanho.
 */
export class Anexo extends Entity<AnexoProps> {
  private constructor(params: AnexoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get pacienteId(): string | null {
    return this.props.pacienteId;
  }
  get atendimentoId(): string | null {
    return this.props.atendimentoId;
  }
  get nomeArquivo(): string {
    return this.props.nomeArquivo;
  }
  get descricao(): string | null {
    return this.props.descricao;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get tamanhoBytes(): number {
    return this.props.tamanhoBytes;
  }
  get storageBucket(): string {
    return this.props.storageBucket;
  }
  get storagePath(): string {
    return this.props.storagePath;
  }
  get uploadedBy(): string | null {
    return this.props.uploadedBy;
  }

  /** Caminho padronizado: anexos/{rede_id}/{paciente_id}/{arquivo} (§4.3). */
  public static montarCaminho(params: {
    redeId: string;
    pacienteId: string;
    anexoId: string;
    extensao: string;
  }): string {
    return `${params.redeId}/${params.pacienteId}/${params.anexoId}.${params.extensao}`;
  }

  public static create(params: CreateAnexoParams): Result<Anexo> {
    if (!params.pacienteId && !params.atendimentoId) {
      return Result.fail(new AnexoInvalidoError({ reason: 'Anexo deve estar vinculado a um paciente ou atendimento' }));
    }

    if (!MIME_TYPES_ANEXO.includes(params.mimeType)) {
      return Result.fail(
        new AnexoInvalidoError({ reason: 'Formato não permitido. Envie PDF, JPG ou PNG.' }),
      );
    }

    if (params.tamanhoBytes <= 0 || params.tamanhoBytes > TAMANHO_MAXIMO_ANEXO_BYTES) {
      return Result.fail(new AnexoInvalidoError({ reason: 'Arquivo deve ter no máximo 10 MB' }));
    }

    if (!params.storagePath || !params.storageBucket) {
      return Result.fail(new AnexoInvalidoError({ reason: 'Arquivo ainda não foi enviado ao storage' }));
    }

    return Result.ok(
      new Anexo({
        id: params.id ? Identifier.fromExisting(params.id) : undefined,
        props: {
          redeId: params.redeId,
          pacienteId: params.pacienteId ?? null,
          atendimentoId: params.atendimentoId ?? null,
          nomeArquivo: params.nomeArquivo.trim(),
          descricao: params.descricao ?? null,
          mimeType: params.mimeType,
          tamanhoBytes: params.tamanhoBytes,
          storageBucket: params.storageBucket,
          storagePath: params.storagePath,
          uploadedBy: params.uploadedBy ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: AnexoConstructorParams): Anexo {
    return new Anexo(params);
  }

  public extensao(): string {
    if (this.props.mimeType === 'application/pdf') return 'pdf';
    if (this.props.mimeType === 'image/png') return 'png';
    return 'jpg';
  }
}
