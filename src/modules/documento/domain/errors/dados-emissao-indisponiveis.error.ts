import { NotFoundError } from '@core/domain/errors/not-found.error';

export type DadosEmissaoIndisponiveisErrorParams = { documentoId: string };

export class DadosEmissaoIndisponiveisError extends NotFoundError {
  constructor(params: DadosEmissaoIndisponiveisErrorParams) {
    super({
      message: `Não foi possível reunir os dados de emissão do documento "${params.documentoId}" (rede, unidade, paciente ou profissional)`,
      code: 'DADOS_EMISSAO_NAO_ENCONTRADOS',
    });
    this.name = 'DadosEmissaoIndisponiveisError';
  }
}
