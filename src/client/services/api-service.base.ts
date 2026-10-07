import type { HttpClient } from './http-client';

export type ApiServiceDependencies = { httpClient: HttpClient };

/** Única ponte entre o client e a API HTTP (ARCHITECTURE.md §6.3). */
export abstract class ApiService {
  protected readonly httpClient: HttpClient;

  protected constructor(dependencies: ApiServiceDependencies) {
    this.httpClient = dependencies.httpClient;
  }
}
