import { DomainError } from '@core/domain/errors/domain-error.base';

export type DocumentoImutavelErrorParams = { documentoId: string };

export class DocumentoImutavelError extends DomainError {
  constructor(params: DocumentoImutavelErrorParams) {
    super({
      message: `O documento "${params.documentoId}" já foi emitido e não pode ser alterado`,
      code: 'DOCUMENTO_IMUTAVEL',
    });
    this.name = 'DocumentoImutavelError';
  }
}
