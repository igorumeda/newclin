import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ConflictError } from '@core/domain/errors/conflict.error';
import { ValidationError } from '@core/domain/errors/validation.error';

export type DocumentoNotFoundErrorParams = { documentoId: string };

export class DocumentoNotFoundError extends NotFoundError {
  constructor(params: DocumentoNotFoundErrorParams) {
    super({ message: `Documento "${params.documentoId}" não encontrado`, code: 'DOCUMENTO_NOT_FOUND' });
    this.name = 'DocumentoNotFoundError';
  }
}

export type DocumentoFinalizadoErrorParams = { documentoId: string };

/** Imutabilidade após a emissão (§3.6). */
export class DocumentoFinalizadoError extends ConflictError {
  constructor(params: DocumentoFinalizadoErrorParams) {
    super({
      message: 'Documento emitido é imutável. Cancele-o e emita um novo documento para corrigir.',
      code: 'DOCUMENTO_IMUTAVEL',
    });
    this.name = 'DocumentoFinalizadoError';
  }
}

export type InvalidClinicalDocumentOperationErrorParams = { reason: string };

export class InvalidClinicalDocumentOperationError extends ValidationError {
  constructor(params: InvalidClinicalDocumentOperationErrorParams) {
    super({ message: params.reason, code: 'INVALID_CLINICAL_DOCUMENT_OPERATION' });
    this.name = 'InvalidClinicalDocumentOperationError';
  }
}

export type TipoDocumentoNaoPermitidoErrorParams = { tipo: string; motivo: string };

export class TipoDocumentoNaoPermitidoError extends ValidationError {
  constructor(params: TipoDocumentoNaoPermitidoErrorParams) {
    super({
      message: `Perfil sem permissão para emitir ${params.tipo}: ${params.motivo}`,
      code: 'TIPO_DOCUMENTO_NAO_PERMITIDO',
    });
    this.name = 'TipoDocumentoNaoPermitidoError';
  }
}
