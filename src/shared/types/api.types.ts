export type ApiErrorPayload = { code: string; message: string; details?: unknown };
export type ApiSuccessResponse<T> = { data: T; meta?: Record<string, unknown> };
export type ApiErrorResponse = { error: ApiErrorPayload };
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
