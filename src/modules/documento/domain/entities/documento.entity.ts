import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { DocumentoImutavelError } from '../errors/documento-imutavel.error';
import { TipoDocumento } from '../value-objects/tipo-documento.vo';

export type ConteudoDocumento = Record<string, unknown>;
export const STATUS_DOCUMENTO = ['rascunho', 'emitido'] as const;
export type StatusDocumento = (typeof STATUS_DOCUMENTO)[number];

export type DocumentoProps = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  atendimentoId: string | null;
  profissionalId: string;
  tipo: TipoDocumento;
  conteudo: ConteudoDocumento;
  status: StatusDocumento;
  storageKey: string | null;
  pdfUrl: string | null;
  emitidoEm: Date | null;
  emitidoPor: string | null;
};

export type DocumentoConstructorParams = EntityConstructorParams<DocumentoProps>;
export type ReconstituirDocumentoParams = DocumentoConstructorParams & {
  id: NonNullable<DocumentoConstructorParams['id']>;
};
export type CriarDocumentoParams = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  atendimentoId?: string | null;
  profissionalId: string;
  tipo: string;
  conteudo: ConteudoDocumento;
};
export type AtualizarConteudoParams = { conteudo: ConteudoDocumento };
export type EmitirDocumentoParams = { storageKey: string; pdfUrl: string | null; emitidoPor: string | null };

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

  get conteudo(): ConteudoDocumento {
    return this.props.conteudo;
  }

  get status(): StatusDocumento {
    return this.props.status;
  }

  get storageKey(): string | null {
    return this.props.storageKey;
  }

  get pdfUrl(): string | null {
    return this.props.pdfUrl;
  }

  get emitidoEm(): Date | null {
    return this.props.emitidoEm;
  }

  get emitidoPor(): string | null {
    return this.props.emitidoPor;
  }

  get isEmitido(): boolean {
    return this.props.status === 'emitido';
  }

  private static validarConteudo(tipo: TipoDocumento, conteudo: ConteudoDocumento): Result<void> {
    const faltantes = tipo.camposObrigatorios.filter((campo) => {
      const valor = conteudo[campo];
      if (valor === null || valor === undefined) return true;
      if (typeof valor === 'string') return valor.trim().length === 0;
      if (Array.isArray(valor)) return valor.length === 0;
      return false;
    });
    if (faltantes.length > 0) {
      return Result.fail(
        new Error(`Preencha os campos obrigatórios do documento: ${faltantes.join(', ')}`),
      );
    }
    return Result.ok();
  }

  public static create(params: CriarDocumentoParams): Result<Documento> {
    const tipoResult = TipoDocumento.create(params.tipo);
    if (tipoResult.isFailure) return Result.propagate(tipoResult);

    const conteudoResult = Documento.validarConteudo(tipoResult.value, params.conteudo);
    if (conteudoResult.isFailure) return Result.propagate(conteudoResult);

    return Result.ok(
      new Documento({
        props: {
          redeId: params.redeId,
          unidadeId: params.unidadeId,
          pacienteId: params.pacienteId,
          atendimentoId: params.atendimentoId ?? null,
          profissionalId: params.profissionalId,
          tipo: tipoResult.value,
          conteudo: params.conteudo,
          status: 'rascunho',
          storageKey: null,
          pdfUrl: null,
          emitidoEm: null,
          emitidoPor: null,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirDocumentoParams): Documento {
    return new Documento(params);
  }

  public atualizarConteudo({ conteudo }: AtualizarConteudoParams): Result<void> {
    if (this.isEmitido) {
      return Result.fail(new DocumentoImutavelError({ documentoId: this.id.toString() }));
    }
    const validacao = Documento.validarConteudo(this.props.tipo, conteudo);
    if (validacao.isFailure) return Result.propagate(validacao);
    this.props.conteudo = conteudo;
    this.touch();
    return Result.ok();
  }

  public emitir(params: EmitirDocumentoParams): Result<void> {
    if (this.isEmitido) {
      return Result.fail(new DocumentoImutavelError({ documentoId: this.id.toString() }));
    }
    this.props.status = 'emitido';
    this.props.storageKey = params.storageKey;
    this.props.pdfUrl = params.pdfUrl;
    this.props.emitidoEm = new Date();
    this.props.emitidoPor = params.emitidoPor;
    this.touch();
    return Result.ok();
  }
}
