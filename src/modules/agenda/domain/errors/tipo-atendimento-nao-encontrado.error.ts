import { NotFoundError } from '@core/domain/errors/not-found.error';

export type TipoAtendimentoNaoEncontradoErrorParams = { tipoId: string };

export class TipoAtendimentoNaoEncontradoError extends NotFoundError {
  constructor(params: TipoAtendimentoNaoEncontradoErrorParams) {
    super({
      message: `Tipo de atendimento "${params.tipoId}" não encontrado`,
      code: 'TIPO_ATENDIMENTO_NAO_ENCONTRADO',
    });
    this.name = 'TipoAtendimentoNaoEncontradoError';
  }
}
