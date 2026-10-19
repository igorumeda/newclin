import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { buildPaginationMeta } from '@core/application/pagination/pagination';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  CancelarNotificacoesAgendamentoInputDto,
  CancelarNotificacoesAgendamentoOutputDto,
  EnfileirarLembretesInputDto,
  EnfileirarLembretesOutputDto,
  EnviarNotificacaoInputDto,
  ListarModelosMensagemInputDto,
  ListarModelosMensagemOutputDto,
  ListarNotificacoesInputDto,
  ListarNotificacoesOutputDto,
  ProcessarFilaNotificacoesInputDto,
  ProcessarFilaNotificacoesOutputDto,
  ProcessarRespostaWhatsappInputDto,
  ProcessarRespostaWhatsappOutputDto,
  SalvarModeloMensagemInputDto,
  SalvarModeloMensagemOutputDto,
} from '../../../application/dtos/notificacao.dto';
import type { EnviarNotificacaoResultado } from '../../../application/use-cases/enviar-notificacao/enviar-notificacao.use-case';

export type NotificacaoControllerDependencies = {
  listarNotificacoes: IUseCase<ListarNotificacoesInputDto, ListarNotificacoesOutputDto>;
  listarModelosMensagem: IUseCase<ListarModelosMensagemInputDto, ListarModelosMensagemOutputDto>;
  salvarModeloMensagem: IUseCase<SalvarModeloMensagemInputDto, SalvarModeloMensagemOutputDto>;
  enviarNotificacao: IUseCase<EnviarNotificacaoInputDto, EnviarNotificacaoResultado>;
  processarFilaNotificacoes: IUseCase<
    ProcessarFilaNotificacoesInputDto,
    ProcessarFilaNotificacoesOutputDto
  >;
  enfileirarLembretes: IUseCase<EnfileirarLembretesInputDto, EnfileirarLembretesOutputDto>;
  processarRespostaWhatsapp: IUseCase<
    ProcessarRespostaWhatsappInputDto,
    ProcessarRespostaWhatsappOutputDto
  >;
  cancelarNotificacoesAgendamento: IUseCase<
    CancelarNotificacoesAgendamentoInputDto,
    CancelarNotificacoesAgendamentoOutputDto
  >;
};

export type NotificacaoControllerRequest =
  | { action: 'listar'; context: RequestContext; input: Omit<ListarNotificacoesInputDto, 'redeId'> }
  | { action: 'listar-modelos'; context: RequestContext }
  | {
      action: 'salvar-modelo';
      context: RequestContext;
      input: Omit<SalvarModeloMensagemInputDto, 'redeId'>;
    }
  | { action: 'reenviar'; context: RequestContext; notificacaoId: string }
  | { action: 'processar-fila'; context: RequestContext; input: ProcessarFilaNotificacoesInputDto }
  | { action: 'enfileirar-lembretes'; context: RequestContext; input: EnfileirarLembretesInputDto }
  | { action: 'webhook'; context: RequestContext; input: ProcessarRespostaWhatsappInputDto }
  | { action: 'cancelar-por-agendamento'; context: RequestContext; agendamentoId: string; motivo?: string | null };

export class NotificacaoController extends Controller<NotificacaoControllerRequest, HttpResponse> {
  private readonly dependencies: NotificacaoControllerDependencies;

  constructor(dependencies: NotificacaoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: NotificacaoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'listar': {
        const result = await this.dependencies.listarNotificacoes.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        const { items, total, page, perPage } = result.value;
        return HttpResponse.ok(items, buildPaginationMeta({ pagination: { page, perPage }, total }));
      }

      case 'listar-modelos': {
        const result = await this.dependencies.listarModelosMensagem.execute({
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value.items, { total: result.value.items.length });
      }

      case 'salvar-modelo': {
        const result = await this.dependencies.salvarModeloMensagem.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'reenviar': {
        const result = await this.dependencies.enviarNotificacao.execute({
          notificacaoId: request.notificacaoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        const { dto, enviada, erro, fallbackEmail } = result.value;
        return HttpResponse.ok(dto, { enviada, erro, fallbackEmail });
      }

      case 'processar-fila': {
        const result = await this.dependencies.processarFilaNotificacoes.execute(request.input);
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value, {
          processadas: result.value.processadas,
          enviadas: result.value.enviadas,
          falhas: result.value.falhas,
        });
      }

      case 'enfileirar-lembretes': {
        const result = await this.dependencies.enfileirarLembretes.execute({
          ...request.input,
          redeId: request.input.redeId ?? (request.context.redeId || null),
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value, {
          agendamentosAnalisados: result.value.agendamentosAnalisados,
          lembretesEnfileirados: result.value.lembretesEnfileirados,
        });
      }

      case 'webhook': {
        const result = await this.dependencies.processarRespostaWhatsapp.execute(request.input);
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value, { processadas: result.value.processadas });
      }

      case 'cancelar-por-agendamento': {
        const result = await this.dependencies.cancelarNotificacoesAgendamento.execute({
          agendamentoId: request.agendamentoId,
          motivo: request.motivo ?? null,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
