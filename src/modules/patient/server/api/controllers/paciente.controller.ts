import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AtualizarPacienteInputDto,
  AtualizarPacienteOutputDto,
  CriarPacienteInputDto,
  CriarPacienteOutputDto,
  ExportarDadosPacienteInputDto,
  ExportarDadosPacienteOutputDto,
  ImportarPacientesInputDto,
  ImportarPacientesOutputDto,
  InativarPacienteInputDto,
  InativarPacienteOutputDto,
  ListarPacientesInputDto,
  ListarPacientesOutputDto,
  ObterPacienteInputDto,
  ObterPacienteOutputDto,
  VerificarDuplicidadeInputDto,
  VerificarDuplicidadeOutputDto,
} from '../../../application/dtos/paciente.dto';
import { buildPaginationMeta } from '@core/application/pagination/pagination';

export type PacienteControllerDependencies = {
  listarPacientes: IUseCase<ListarPacientesInputDto, ListarPacientesOutputDto>;
  obterPaciente: IUseCase<ObterPacienteInputDto, ObterPacienteOutputDto>;
  criarPaciente: IUseCase<CriarPacienteInputDto, CriarPacienteOutputDto>;
  atualizarPaciente: IUseCase<AtualizarPacienteInputDto, AtualizarPacienteOutputDto>;
  inativarPaciente: IUseCase<InativarPacienteInputDto, InativarPacienteOutputDto>;
  verificarDuplicidade: IUseCase<VerificarDuplicidadeInputDto, VerificarDuplicidadeOutputDto>;
  importarPacientes: IUseCase<ImportarPacientesInputDto, ImportarPacientesOutputDto>;
  exportarDadosPaciente: IUseCase<ExportarDadosPacienteInputDto, ExportarDadosPacienteOutputDto>;
};

export type PacienteControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarPacientesInputDto, 'redeId'> }
  | { action: 'obter'; context: RequestContext; pacienteId: string }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarPacienteInputDto, 'redeId'> }
  | {
      action: 'atualizar';
      context: RequestContext;
      pacienteId: string;
      input: Omit<AtualizarPacienteInputDto, 'pacienteId'>;
    }
  | { action: 'inativar'; context: RequestContext; pacienteId: string; reativar: boolean }
  | {
      action: 'verificar-duplicidade';
      context: RequestContext;
      input: Omit<VerificarDuplicidadeInputDto, 'redeId'>;
    }
  | { action: 'importar'; context: RequestContext; input: Omit<ImportarPacientesInputDto, 'redeId' | 'importadoPor'> }
  | { action: 'exportar-dados'; context: RequestContext; pacienteId: string };

export class PacienteController extends Controller<PacienteControllerRequest, HttpResponse> {
  private readonly dependencies: PacienteControllerDependencies;

  constructor(dependencies: PacienteControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: PacienteControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarPacientes.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        const { items, total, page, perPage } = result.value;
        return HttpResponse.ok(items, buildPaginationMeta({ pagination: { page, perPage }, total }));
      }

      case 'obter': {
        const result = await this.dependencies.obterPaciente.execute({ pacienteId: request.pacienteId });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'criar': {
        const result = await this.dependencies.criarPaciente.execute({
          ...request.input,
          redeId: request.context.redeId,
          consentimentoOrigem: request.input.consentimentoOrigem ?? request.context.role,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'atualizar': {
        const result = await this.dependencies.atualizarPaciente.execute({
          ...request.input,
          pacienteId: request.pacienteId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'inativar': {
        const result = await this.dependencies.inativarPaciente.execute({
          pacienteId: request.pacienteId,
          reativar: request.reativar,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'verificar-duplicidade': {
        const result = await this.dependencies.verificarDuplicidade.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'importar': {
        const result = await this.dependencies.importarPacientes.execute({
          ...request.input,
          redeId: request.context.redeId,
          importadoPor: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.relatorio, {
          importados: result.value.relatorio.importados,
          ignorados: result.value.relatorio.ignorados,
          erros: result.value.relatorio.erros,
        });
      }

      case 'exportar-dados': {
        const result = await this.dependencies.exportarDadosPaciente.execute({
          pacienteId: request.pacienteId,
          solicitadoPor: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
