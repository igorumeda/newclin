import type {
  DadosEmissaoDocumento,
  IDadosEmissaoRepository,
  ObterDadosEmissaoParams,
} from './dados-emissao-repository.interface';

export abstract class DadosEmissaoRepository implements IDadosEmissaoRepository {
  abstract obter(params: ObterDadosEmissaoParams): Promise<DadosEmissaoDocumento | null>;
}
