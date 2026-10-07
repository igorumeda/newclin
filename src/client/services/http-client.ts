/** Contrato de transporte HTTP do client e sua implementação com `fetch`. */
import type { ApiErrorResponse } from '@/shared/types/api.types';

export type HttpQueryParams = Record<string, string | number | boolean | undefined | null>;
export type HttpGetParams = { path: string; params?: HttpQueryParams };
export type HttpBodyParams<Body> = { path: string; body?: Body; params?: HttpQueryParams };

export interface HttpClient {
  get<Response>(params: HttpGetParams): Promise<Response>;
  post<Response, Body>(params: HttpBodyParams<Body>): Promise<Response>;
  put<Response, Body>(params: HttpBodyParams<Body>): Promise<Response>;
  patch<Response, Body>(params: HttpBodyParams<Body>): Promise<Response>;
  delete<Response>(params: HttpGetParams): Promise<Response>;
}

export type ApiErrorParams = { message: string; code: string; status: number; details?: unknown };

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
  }
}

type RequisicaoParams = {
  metodo: string;
  path: string;
  body?: unknown;
  params?: HttpQueryParams;
};

function montarUrl({ path, params }: HttpGetParams): string {
  if (!params) return path;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null || valor === '') return;
    query.set(chave, String(valor));
  });
  const texto = query.toString();
  return texto ? `${path}?${texto}` : path;
}

/** Usa caminhos relativos: o browser sempre fala com a própria origem. */
export class FetchHttpClient implements HttpClient {
  private async request<Response>({
    metodo,
    path,
    body,
    params,
  }: RequisicaoParams): Promise<Response> {
    const resposta = await fetch(montarUrl({ path, params }), {
      method: metodo,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });

    if (resposta.status === 204) return undefined as Response;

    const payload = (await resposta.json().catch(() => null)) as
      | { data?: unknown; meta?: unknown }
      | ApiErrorResponse
      | null;

    if (!resposta.ok) {
      const erro = (payload as ApiErrorResponse | null)?.error;
      throw new ApiError({
        message: erro?.message ?? 'Não foi possível concluir a operação',
        code: erro?.code ?? 'REQUEST_FAILED',
        status: resposta.status,
        details: erro?.details,
      });
    }

    return payload as Response;
  }

  get<Response>({ path, params }: HttpGetParams): Promise<Response> {
    return this.request<Response>({ metodo: 'GET', path, params });
  }

  post<Response, Body>({ path, body, params }: HttpBodyParams<Body>): Promise<Response> {
    return this.request<Response>({ metodo: 'POST', path, body, params });
  }

  put<Response, Body>({ path, body, params }: HttpBodyParams<Body>): Promise<Response> {
    return this.request<Response>({ metodo: 'PUT', path, body, params });
  }

  patch<Response, Body>({ path, body, params }: HttpBodyParams<Body>): Promise<Response> {
    return this.request<Response>({ metodo: 'PATCH', path, body, params });
  }

  delete<Response>({ path, params }: HttpGetParams): Promise<Response> {
    return this.request<Response>({ metodo: 'DELETE', path, params });
  }
}

export const httpClient: HttpClient = new FetchHttpClient();
