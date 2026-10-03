import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import {
  ConteudoDocumentoVO,
  type ConteudoDocumento,
} from '../value-objects/conteudo-documento.vo';
import { TIPO_DOCUMENTO_PREFIXOS, type TipoDocumento } from '../value-objects/tipo-documento.vo';
import {
  DocumentoFinalizadoError,
  InvalidClinicalDocumentOperationError,
} from '../errors/documento.errors';

export type StatusDocumento = 'rascunho' | 'emitido' | 'cancelado';

export type DocumentoProps = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  atendimentoId: string | null;
  profissionalId: string;
  tipo: TipoDocumento;
  numero: number;
  conteudo: ConteudoDocumentoVO;
  status: StatusDocumento;
  storageBucket: string;
  storagePath: string | null;
  emitidoEm: Date | null;
  emitidoPor: string | null;
  canceladoEm: Date | null;
  motivoCancelamento: string | null;
  createdBy: string | null;
};

export type DocumentoConstructorParams = EntityConstructorParams<DocumentoProps>;

export type CreateDocumentoParams = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  atendimentoId?: string | null;
  tipo: TipoDocumento;
  conteudo?: ConteudoDocumento;
  createdBy?: string | null;
};

export const BUCKET_DOCUMENTOS = 'documentos';

/**
 * Documento clínico (§3.6). O conteúdo é editável enquanto rascunho; após a
 * emissão o PDF é armazenado e o registro passa a ser imutável (só cancelável).
 */
export class Documento extends AggregateRoot<DocumentoProps> {
  private constructor(params: DocumentoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get unidadeId(): string {
    return this.props.unidadeId;
  }
  get pacienteId(): string {
    return this.props.pacienteId;
  }
  get atendimentoId(): string | null {
    return this.props.atendimentoId;
  }
  get profissionalId(): string {
    return this.props.profissionalId;
  }
  get tipo(): TipoDocumento {
    return this.props.tipo;
  }
  get numero(): number {
    return this.props.numero;
  }
  get conteudo(): ConteudoDocumentoVO {
    return this.props.conteudo;
  }
  get status(): StatusDocumento {
    return this.props.status;
  }
  get storageBucket(): string {
    return this.props.storageBucket;
  }
  get storagePath(): string | null {
    return this.props.storagePath;
  }
  get emitidoEm(): Date | null {
    return this.props.emitidoEm;
  }
  get emitidoPor(): string | null {
    return this.props.emitidoPor;
  }
  get canceladoEm(): Date | null {
    return this.props.canceladoEm;
  }
  get motivoCancelamento(): string | null {
    return this.props.motivoCancelamento;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }

  public estaEmitido(): boolean {
    return this.props.status === 'emitido';
  }

  /** Numeração legível: REC-000012. */
  public numeroFormatado(): string {
    return `${TIPO_DOCUMENTO_PREFIXOS[this.props.tipo]}-${String(this.props.numero).padStart(6, '0')}`;
  }

  public static create(params: CreateDocumentoParams): Result<Documento> {
    const conteudoResult = ConteudoDocumentoVO.create(params.conteudo ?? {});
    if (conteudoResult.isFailure) return Result.fail(conteudoResult.error);

    return Result.ok(
      new Documento({
        props: {
          redeId: params.redeId,
          unidadeId: params.unidadeId,
          pacienteId: params.pacienteId,
          atendimentoId: params.atendimentoId ?? null,
          profissionalId: params.profissionalId,
          tipo: params.tipo,
          numero: 0, // atribuído pelo banco via `proximo_numero_documento()`
          conteudo: conteudoResult.value,
          status: 'rascunho',
          storageBucket: BUCKET_DOCUMENTOS,
          storagePath: null,
          emitidoEm: null,
          emitidoPor: null,
          canceladoEm: null,
          motivoCancelamento: null,
          createdBy: params.createdBy ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: DocumentoConstructorParams): Documento {
    return new Documento(params);
  }

  /** Caminho no storage: documentos/{rede_id}/{tipo}/{numero}-{documento_id}.pdf */
  public montarCaminho(): string {
    return `${this.props.redeId}/${this.props.tipo}/${this.numeroFormatado()}-${this.id.toString()}.pdf`;
  }

  public atualizarConteudo(conteudo: ConteudoDocumento): Result<void> {
    if (this.props.status !== 'rascunho') {
      return Result.fail(new DocumentoFinalizadoError({ documentoId: this.id.toString() }));
    }

    const conteudoResult = ConteudoDocumentoVO.create(conteudo);
    if (conteudoResult.isFailure) return Result.fail(conteudoResult.error);

    this.props.conteudo = conteudoResult.value;
    this.touch();
    return Result.ok();
  }

  /** Valida o conteúdo obrigatório do tipo — chamado antes de gerar o PDF. */
  public validarParaEmissao(): Result<void> {
    const problemas = this.props.conteudo.validarParaEmissao({ tipo: this.props.tipo });

    if (problemas.length > 0) {
      return Result.fail(
        new InvalidClinicalDocumentOperationError({ reason: problemas.join('; ') }),
      );
    }

    return Result.ok();
  }

  public emitir(params: { storagePath: string; por: string }): Result<void> {
    if (this.props.status === 'emitido') {
      return Result.fail(new DocumentoFinalizadoError({ documentoId: this.id.toString() }));
    }
    if (this.props.status === 'cancelado') {
      return Result.fail(
        new InvalidClinicalDocumentOperationError({
          reason: 'Documento cancelado não pode ser emitido — crie um novo documento',
        }),
      );
    }

    const validacao = this.validarParaEmissao();
    if (validacao.isFailure) return Result.fail(validacao.error);

    this.props.status = 'emitido';
    this.props.storagePath = params.storagePath;
    this.props.emitidoEm = new Date();
    this.props.emitidoPor = params.por;
    this.touch();

    return Result.ok();
  }

  public cancelar(params: { motivo: string }): Result<void> {
    if (this.props.status === 'cancelado') {
      return Result.fail(
        new InvalidClinicalDocumentOperationError({ reason: 'Documento já está cancelado' }),
      );
    }

    const motivo = params.motivo?.trim();
    if (!motivo || motivo.length < 3) {
      return Result.fail(
        new InvalidClinicalDocumentOperationError({ reason: 'Informe o motivo do cancelamento' }),
      );
    }

    this.props.status = 'cancelado';
    this.props.canceladoEm = new Date();
    this.props.motivoCancelamento = motivo;
    this.touch();

    return Result.ok();
  }
}
