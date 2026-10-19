/**
 * Cliente HTTP do browser (§12.2): sempre relativo (`/api/...`), lê o envelope
 * `{ data, meta }` e converte `{ error }` em `ApiError` tipado.
 */
export type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };

export type ApiErrorBody = { error: { code: string; message: string; details?: unknown } };

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(params: { message: string; code: string; status: number; details?: unknown }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
  }

  get isValidation(): boolean {
    return this.code === 'VALIDATION_ERROR' || this.status === 422;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

function buildUrl(path: string, query?: QueryParams): string {
  if (!query) return path;

  const search = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query)) {
    if (valor === undefined || valor === null || valor === '') continue;
    search.set(chave, String(valor));
  }

  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  // `FormData` (upload de arquivos) vai sem Content-Type explícito: o browser
  // define o boundary do multipart.
  const ehFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: {
      ...(ehFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    body: ehFormData
      ? (options.body as FormData)
      : options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
    signal: options.signal,
    credentials: 'same-origin',
  });

  if (response.status === 204) return { data: undefined as T };

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorBody | null;

  if (!response.ok) {
    const erro = (payload as ApiErrorBody | null)?.error;

    throw new ApiError({
      status: response.status,
      code: erro?.code ?? 'UNKNOWN_ERROR',
      message: erro?.message ?? 'Não foi possível concluir a operação',
      details: erro?.details,
    });
  }

  return (payload as ApiEnvelope<T>) ?? { data: undefined as T };
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>('PUT', path, options),
  patch: <T>(path: string, options?: RequestOptions) => request<T>('PATCH', path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};

/** Extrai apenas os dados — usado pelos services de cada módulo. */
export const api = {
  get: async <T>(path: string, options?: RequestOptions): Promise<T> => (await apiClient.get<T>(path, options)).data,
  post: async <T>(path: string, options?: RequestOptions): Promise<T> =>
    (await apiClient.post<T>(path, options)).data,
  put: async <T>(path: string, options?: RequestOptions): Promise<T> =>
    (await apiClient.put<T>(path, options)).data,
  patch: async <T>(path: string, options?: RequestOptions): Promise<T> =>
    (await apiClient.patch<T>(path, options)).data,
  delete: async <T>(path: string, options?: RequestOptions): Promise<T> =>
    (await apiClient.delete<T>(path, options)).data,
  getWithMeta: <T>(path: string, options?: RequestOptions): Promise<ApiEnvelope<T>> =>
    apiClient.get<T>(path, options),
};

/** Mensagem amigável para qualquer erro lançado (inclui erro de rede). */
export function mensagemDeErro(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Erro inesperado ao processar a solicitação';
}

export function problemasDeValidacao(error: unknown): { campo: string; mensagem: string }[] {
  if (!(error instanceof ApiError)) return [];

  const details = error.details as { problemas?: { caminho: string; mensagem: string }[] } | undefined;
  return (details?.problemas ?? []).map((problema) => ({ campo: problema.caminho, mensagem: problema.mensagem }));
}
