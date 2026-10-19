import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { IUseCase } from '@core/application/use-case.interface';
import type { ListarAuditoriaInputDto } from '../../../application/use-cases/listar-auditoria/listar-auditoria.input.dto';
import type { ListarAuditoriaOutputDto } from '../../../application/use-cases/listar-auditoria/listar-auditoria.output.dto';

export type AuditoriaControllerDependencies = {
  listarAuditoria: IUseCase<ListarAuditoriaInputDto, ListarAuditoriaOutputDto>;
};

export type AuditoriaControllerRequest = {
  action: 'listar';
  redeId: string;
  input: Omit<ListarAuditoriaInputDto, 'redeId'>;
};

export class AuditoriaController extends Controller<AuditoriaControllerRequest, HttpResponse> {
  private readonly dependencies: AuditoriaControllerDependencies;

  constructor(dependencies: AuditoriaControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: AuditoriaControllerRequest): Promise<HttpResponse> {
    const result = await this.dependencies.listarAuditoria.execute({
      ...request.input,
      redeId: request.redeId,
    });

    if (result.isFailure) return HttpResponse.fromDomainError(result.error);
    return HttpResponse.ok(result.value.items, { ...result.value.meta });
  }
}
