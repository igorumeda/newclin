import { SignJWT, jwtVerify } from 'jose';
import { TokenProvider } from './token-provider.base';
import type {
  AssinarTokenParams,
  SessaoPayload,
  VerificarTokenParams,
} from '../../../domain/services/token-provider.interface';

export type JwtTokenProviderDependencies = { secret: string; issuer?: string };

export class JwtTokenProvider extends TokenProvider {
  private readonly secret: Uint8Array;
  private readonly issuer: string;

  constructor(dependencies: JwtTokenProviderDependencies) {
    super();
    this.secret = new TextEncoder().encode(dependencies.secret);
    this.issuer = dependencies.issuer ?? 'newclin';
  }

  async assinar({ payload, expiraEmHoras }: AssinarTokenParams): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setExpirationTime(`${expiraEmHoras}h`)
      .sign(this.secret);
  }

  async verificar({ token }: VerificarTokenParams): Promise<SessaoPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, { issuer: this.issuer });
      return {
        usuarioId: String(payload.usuarioId),
        redeId: String(payload.redeId),
        nome: String(payload.nome),
        email: String(payload.email),
        role: String(payload.role),
        unidadesAcesso: Array.isArray(payload.unidadesAcesso)
          ? (payload.unidadesAcesso as string[])
          : [],
        profissionalId: payload.profissionalId ? String(payload.profissionalId) : null,
      };
    } catch {
      return null;
    }
  }
}
