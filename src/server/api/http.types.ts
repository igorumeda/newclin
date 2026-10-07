export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type HttpHeaders = Record<string, string>;
export type HttpQuery = Record<string, string | undefined>;
export type HttpRouteParams = Record<string, string>;

export type AuthenticatedUser = {
  id: string;
  redeId: string;
  nome: string;
  email: string;
  role: string;
  unidadesAcesso: string[];
  profissionalId: string | null;
};

export type HttpRequest<Body = unknown> = {
  method: HttpMethod;
  path: string;
  params: HttpRouteParams;
  query: HttpQuery;
  body: Body;
  usuario: AuthenticatedUser | null;
  ip: string;
  userAgent: string;
};

export type HttpResponsePayload = {
  status: number;
  body: unknown;
  headers?: HttpHeaders;
};
