export type SessaoPayload = {
  usuarioId: string;
  redeId: string;
  nome: string;
  email: string;
  role: string;
  unidadesAcesso: string[];
  profissionalId: string | null;
};

export type AssinarTokenParams = { payload: SessaoPayload; expiraEmHoras: number };
export type VerificarTokenParams = { token: string };

export interface ITokenProvider {
  assinar(params: AssinarTokenParams): Promise<string>;
  verificar(params: VerificarTokenParams): Promise<SessaoPayload | null>;
}

export const TOKEN_PROVIDER = Symbol('ITokenProvider');
