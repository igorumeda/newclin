import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AlterarStatusAgendamentoInputDto,
  AlterarStatusAgendamentoOutputDto,
  AtualizarAgendamentoInputDto,
  AtualizarAgendamentoOutputDto,
  CancelarAgendamentoInputDto,
  CancelarAgendamentoOutputDto,
  CriarAgendamentoInputDto,
  CriarAgendamentoOutputDto,
  ListarAgendaInputDto,
  ListarAgendaOutputDto,
  ListarHorariosDisponiveisInputDto,
  ListarHorariosDisponiveisOutputDto,
  ObterAgendamentoInputDto,
  ObterAgendamentoOutputDto,
  VerificarConflitoInputDto,
  VerificarConflitoOutputDto,
} from '../../../application/dtos/agenda.dto';

export type AgendaControllerDependencies = {
  listarAgenda: IUseCase<ListarAgendaInputDto, ListarAgendaOutputDto>;
  obterAgendamento: IUseCase<ObterAgendamentoInputDto, ObterAgendamentoOutputDto>;
  criarAgendamento: IUseCase<CriarAgendamentoInputDto, CriarAgendamentoOutputDto>;
  atualizarAgendamento: IUseCase<AtualizarAgendamentoInputDto, AtualizarAgendamentoOutputDto>;
  alterarStatus: IUseCase<AlterarStatusAgendamentoInputDto, AlterarStatusAgendamentoOutputDto>;
  cancelarAgendamento: IUseCase<CancelarAgendamentoInputDto, CancelarAgendamentoOutputDto>;
  verificarConflito: IUseCase<VerificarConflitoInputDto, VerificarConflitoOutputDto>;
  horariosDisponiveis: IUseCase<
    ListarHorariosDisponiveisInputDto,
    ListarHorariosDisponiveisOutputDto
  >;
};

export type AgendaControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarAgendaInputDto, 'redeId'> }
  | { action: 'obter'; context: RequestContext; agendamentoId: string }
  | { action: 'criar'; context: RequestContext; input: Omit<CriarAgendamentoInputDto, 'redeId'> }
  | {
      action: 'atualizar';
      context: RequestContext;
      agendamentoId: string;
      input: Omit<AtualizarAgendamentoInputDto, 'agendamentoId'>;
    }
  | {
      action: 'alterar-status';
      context: RequestContext;
      agendamentoId: string;
      input: Omit<AlterarStatusAgendamentoInputDto, 'agendamentoId'>;
    }
  | {
      action: 'cancelar';
      context: RequestContext;
      agendamentoId: string;
      input: Omit<CancelarAgendamentoInputDto, 'agendamentoId' | 'canceladoPor'>;
    }
  | {
      action: 'verificar-conflito';
      context: RequestContext;
      input: Omit<VerificarConflitoInputDto, 'redeId'>;
    }
  | {
      action: 'horarios-disponiveis';
      context: RequestContext;
      input: Omit<ListarHorariosDisponiveisInputDto, 'redeId'>;
    };

export class AgendaController extends Controller<AgendaControllerRequest, HttpResponse> {
  private readonly dependencies: AgendaControllerDependencies;

  constructor(dependencies: AgendaControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: AgendaControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarAgenda.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.items, { total: result.value.total });
      }

      case 'obter': {
        const result = await this.dependencies.obterAgendamento.execute({
          agendamentoId: request.agendamentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.agendamento, { historico: result.value.historico });
      }

      case 'criar': {
        const result = await this.dependencies.criarAgendamento.execute({
          ...request.input,
          redeId: request.context.redeId,
          criadoPor: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'atualizar': {
        const result = await this.dependencies.atualizarAgendamento.execute({
          ...request.input,
          agendamentoId: request.agendamentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'alterar-status': {
        const result = await this.dependencies.alterarStatus.execute({
          ...request.input,
          agendamentoId: request.agendamentoId,
          por: request.input.por ?? 'recepcao',
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'cancelar': {
        const result = await this.dependencies.cancelarAgendamento.execute({
          ...request.input,
          agendamentoId: request.agendamentoId,
          canceladoPor: request.context.userId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'verificar-conflito': {
        const result = await this.dependencies.verificarConflito.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'horarios-disponiveis': {
        const result = await this.dependencies.horariosDisponiveis.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
