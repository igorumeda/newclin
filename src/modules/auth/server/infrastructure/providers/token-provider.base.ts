import type {
  AssinarTokenParams,
  ITokenProvider,
  SessaoPayload,
  VerificarTokenParams,
} from '../../../domain/services/token-provider.interface';

export abstract class TokenProvider implements ITokenProvider {
  abstract assinar(params: AssinarTokenParams): Promise<string>;
  abstract verificar(params: VerificarTokenParams): Promise<SessaoPayload | null>;
}
