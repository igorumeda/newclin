import type { SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/server/config/env.config';
import {
  ModeloMensagemPersistenceMapper,
  NotificacaoPersistenceMapper,
} from './infrastructure/persistence/mappers/notificacao-persistence.mapper';
import { NotificacaoRepositoryImpl } from './infrastructure/persistence/repositories/notificacao.repository.impl';
import { ModeloMensagemRepositoryImpl } from './infrastructure/persistence/repositories/modelo-mensagem.repository.impl';
import { AgendamentoLembreteReader } from './infrastructure/persistence/repositories/agendamento-lembrete.reader';
import { AgendamentoRespostaAdapter } from './infrastructure/persistence/repositories/agendamento-resposta.adapter';
import { SmtpEmailProvider } from './infrastructure/providers/smtp-email.provider';
import { createWhatsappProvider } from './infrastructure/providers/whatsapp.provider.factory';
import { NotificacaoMapper, ModeloMensagemMapper } from '../application/mappers/notificacao.mapper';
import { EnfileirarNotificacaoUseCase } from '../application/use-cases/enfileirar-notificacao/enfileirar-notificacao.use-case';
import { EnviarNotificacaoUseCase } from '../application/use-cases/enviar-notificacao/enviar-notificacao.use-case';
import { ProcessarFilaNotificacoesUseCase } from '../application/use-cases/processar-fila/processar-fila-notificacoes.use-case';
import { EnfileirarLembretesUseCase } from '../application/use-cases/enfileirar-lembretes/enfileirar-lembretes.use-case';
import { ListarNotificacoesUseCase } from '../application/use-cases/listar-notificacoes/listar-notificacoes.use-case';
import { ListarModelosMensagemUseCase } from '../application/use-cases/listar-modelos-mensagem/listar-modelos-mensagem.use-case';
import { SalvarModeloMensagemUseCase } from '../application/use-cases/salvar-modelo-mensagem/salvar-modelo-mensagem.use-case';
import { ProcessarRespostaWhatsappUseCase } from '../application/use-cases/processar-resposta-whatsapp/processar-resposta-whatsapp.use-case';
import { CancelarNotificacoesAgendamentoUseCase } from '../application/use-cases/cancelar-notificacoes-agendamento/cancelar-notificacoes-agendamento.use-case';
import { NotificacaoDispatcher } from '../application/services/notificacao-dispatcher.service';
import { NotificacaoController } from './api/controllers/notificacao.controller';

export type NotificationModuleDependencies = {
  supabase: SupabaseClient;
  /** service_role: fila, webhook e worker rodam fora de sessão de usuário. */
  serviceClient: SupabaseClient;
};

export function createNotificationModule(dependencies: NotificationModuleDependencies) {
  const env = getEnv();

  const notificacaoMapper = new NotificacaoPersistenceMapper();
  const modeloMapper = new ModeloMensagemPersistenceMapper();
  const mapper = new NotificacaoMapper();
  const modeloDtoMapper = new ModeloMensagemMapper();

  // O coordenador da fila usa service_role; a leitura de tela usa o client RLS.
  const notificacaoRepository = new NotificacaoRepositoryImpl({
    supabase: dependencies.serviceClient,
    mapper: notificacaoMapper,
  });
  const notificacaoQueryRepository = new NotificacaoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: notificacaoMapper,
  });
  const modeloMensagemRepository = new ModeloMensagemRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: modeloMapper,
  });

  const emailSender = new SmtpEmailProvider({
    host: env.SMTP_HOST ?? null,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    usuario: env.SMTP_USER ?? null,
    senha: env.SMTP_PASSWORD ?? null,
    remetente: env.SMTP_FROM ?? null,
    replyTo: env.SMTP_REPLY_TO ?? null,
  });

  const whatsappSender = createWhatsappProvider({
    provider: env.WHATSAPP_PROVIDER,
    apiUrl: env.WHATSAPP_API_URL,
    token: env.WHATSAPP_API_TOKEN ?? null,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? null,
    appSecret: env.WHATSAPP_APP_SECRET ?? null,
    webhookVerifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? null,
  });

  const agendamentoResposta = new AgendamentoRespostaAdapter({ supabase: dependencies.serviceClient });
  const agendamentoLembreteReader = new AgendamentoLembreteReader({
    supabase: dependencies.serviceClient,
  });

  const enfileirarNotificacao = new EnfileirarNotificacaoUseCase({
    notificacaoRepository,
    modeloMensagemRepository,
    mapper,
  });
  const enviarNotificacao = new EnviarNotificacaoUseCase({
    notificacaoRepository,
    emailSender,
    whatsappSender,
    mapper,
    maxTentativas: env.NOTIFICATION_MAX_ATTEMPTS,
    backoffMinutos: 15,
  });
  const processarFilaNotificacoes = new ProcessarFilaNotificacoesUseCase({
    notificacaoRepository,
    enviarNotificacao,
    lotePadrao: env.NOTIFICATION_QUEUE_BATCH_SIZE,
  });
  const dispatcher = new NotificacaoDispatcher({ enfileirarNotificacao });
  const enfileirarLembretes = new EnfileirarLembretesUseCase({
    agendamentoLembreteReader,
    notificacaoRepository,
    dispatcher,
    horasAntecedenciaPadrao: env.NOTIFICATION_REMINDER_HOURS,
    limitePadrao: 200,
  });
  const listarNotificacoes = new ListarNotificacoesUseCase({
    notificacaoRepository: notificacaoQueryRepository,
    mapper,
  });
  const listarModelosMensagem = new ListarModelosMensagemUseCase({
    modeloMensagemRepository,
    mapper: modeloDtoMapper,
  });
  const salvarModeloMensagem = new SalvarModeloMensagemUseCase({
    modeloMensagemRepository,
    mapper: modeloDtoMapper,
  });
  const processarRespostaWhatsapp = new ProcessarRespostaWhatsappUseCase({
    notificacaoRepository,
    whatsappSender,
    agendamentoResposta,
  });
  const cancelarNotificacoesAgendamento = new CancelarNotificacoesAgendamentoUseCase({
    notificacaoRepository,
  });

  const controller = new NotificacaoController({
    listarNotificacoes,
    listarModelosMensagem,
    salvarModeloMensagem,
    enviarNotificacao,
    processarFilaNotificacoes,
    enfileirarLembretes,
    processarRespostaWhatsapp,
    cancelarNotificacoesAgendamento,
  });

  return {
    controller,
    dispatcher,
    providers: { emailSender, whatsappSender },
    repositories: { notificacaoRepository, modeloMensagemRepository },
    useCases: {
      enfileirarNotificacao,
      enviarNotificacao,
      processarFilaNotificacoes,
      enfileirarLembretes,
      listarNotificacoes,
      listarModelosMensagem,
      salvarModeloMensagem,
      processarRespostaWhatsapp,
      cancelarNotificacoesAgendamento,
      notificacaoDispatcher: dispatcher,
    },
  };
}

export type NotificationModule = ReturnType<typeof createNotificationModule>;
