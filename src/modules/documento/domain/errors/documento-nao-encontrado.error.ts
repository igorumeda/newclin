import { NotFoundError } from '@core/domain/errors/not-found.error';

export type DocumentoNaoEncontradoErrorParams = { documentoId: string };

export class DocumentoNaoEncontradoError extends NotFoundError {
  constructor(params: DocumentoNaoEncontradoErrorParams) {
    super({
      message: `Documento "${params.documentoId}" não encontrado`,
      code: 'DOCUMENTO_NAO_ENCONTRADO',
    });
    this.name = 'DocumentoNaoEncontradoError';
  }
}
