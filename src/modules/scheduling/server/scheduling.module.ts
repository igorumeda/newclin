import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificacaoDispatcher } from '@/modules/notification/application/services/notificacao-dispatcher.service';
import type { CancelarNotificacoesAgendamentoUseCase } from '@/modules/notification/application/use-cases/cancelar-notificacoes-agendamento/cancelar-notificacoes-agendamento.use-case';
import type { IPacienteLookup } from '@/modules/patient/domain/services/paciente-lookup.interface';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IRedeLookup } from '@/modules/organization/domain/services/rede-lookup.interface';
import type { IProfissionalLookup } from '@/modules/professional/domain/services/profissional-lookup.interface';
import { SlotAgendaService } from '../domain/services/slot-agenda.service';
import { EstadoAgendamentoNotificacao } from '../domain/services/agenda-status.port';
import {
  AgendamentoPersistenceMapper,
  BloqueioAgendaPersistenceMapper,
  TipoAtendimentoPersistenceMapper,
} from './infrastructure/persistence/mappers/agenda-persistence.mapper';
import { AgendamentoRepositoryImpl } from './infrastructure/persistence/repositories/agendamento.repository.impl';
import { TipoAtendimentoRepositoryImpl } from './infrastructure/persistence/repositories/tipo-atendimento.repository.impl';
import { BloqueioAgendaRepositoryImpl } from './infrastructure/persistence/repositories/bloqueio.repository.impl';
import { AgendaNotificacaoAdapter } from './infrastructure/adapters/agenda-notificacao.adapter';
import {
  AgendamentoMapper,
  BloqueioAgendaMapper,
  TipoAtendimentoMapper,
} from '../application/mappers/agenda.mapper';
import { AgendaEnricher } from '../application/services/agenda-enricher.service';
import { ListarAgendaUseCase } from '../application/use-cases/listar-agenda/listar-agenda.use-case';
import { ObterAgendamentoUseCase } from '../application/use-cases/obter-agendamento/obter-agendamento.use-case';
import { CriarAgendamentoUseCase } from '../application/use-cases/criar-agendamento/criar-agendamento.use-case';
import { AtualizarAgendamentoUseCase } from '../application/use-cases/atualizar-agendamento/atualizar-agendamento.use-case';
import { AlterarStatusAgendamentoUseCase } from '../application/use-cases/alterar-status-agendamento/alterar-status-agendamento.use-case';
import { CancelarAgendamentoUseCase } from '../application/use-cases/cancelar-agendamento/cancelar-agendamento.use-case';
import { RegistrarChegadaUseCase } from '../application/use-cases/registrar-chegada/registrar-chegada.use-case';
import { VerificarConflitoUseCase } from '../application/use-cases/verificar-conflito/verificar-conflito.use-case';
import { PainelRecepcaoUseCase } from '../application/use-cases/painel-recepcao/painel-recepcao.use-case';
import { ListarHorariosDisponiveisUseCase } from '../application/use-cases/horarios-disponiveis/horarios-disponiveis.use-case';
import {
  AtualizarTipoAtendimentoUseCase,
  CriarTipoAtendimentoUseCase,
  InativarTipoAtendimentoUseCase,
  ListarTiposAtendimentoUseCase,
} from '../application/use-cases/tipos-atendimento/tipos-atendimento.use-cases';
import {
  CriarBloqueioUseCase,
  ListarBloqueiosUseCase,
  RemoverBloqueioUseCase,
} from '../application/use-cases/bloqueios/bloqueios.use-cases';
import { AgendaController } from './api/controllers/agenda.controller';
import { RecepcaoController } from './api/controllers/recepcao.controller';
import { TipoAtendimentoController } from './api/controllers/tipo-atendimento.controller';
import { BloqueioController } from './api/controllers/bloqueio.controller';

export type SchedulingModuleDependencies = {
  supabase: SupabaseClient;
  /** Use cases do módulo de notificações (fila e-mail/WhatsApp). */
  notification: {
    notificacaoDispatcher: NotificacaoDispatcher;
    cancelarNotificacoesAgendamento: CancelarNotificacoesAgendamentoUseCase;
  };
  patientLookup: { pacienteLookup: IPacienteLookup };
  organizationLookup: { unidadeLookup: IUnidadeLookup; redeLookup: IRedeLookup };
  /** ACL do módulo de profissionais (grade de horários e cores da agenda). */
  professionalLookup: { profissionalLookup: IProfissionalLookup };
};

export function createSchedulingModule(dependencies: SchedulingModuleDependencies) {
  const { unidadeLookup, redeLookup } = dependencies.organizationLookup;
  const { pacienteLookup } = dependencies.patientLookup;
  const { profissionalLookup } = dependencies.professionalLookup;

  const agendamentoMapper = new AgendamentoPersistenceMapper();
  const tipoMapper = new TipoAtendimentoPersistenceMapper();
  const bloqueioMapper = new BloqueioAgendaPersistenceMapper();

  const mapper = new AgendamentoMapper();
  const tipoDtoMapper = new TipoAtendimentoMapper();
  const bloqueioDtoMapper = new BloqueioAgendaMapper();

  const agendamentoRepository = new AgendamentoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: agendamentoMapper,
  });
  const tipoAtendimentoRepository = new TipoAtendimentoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: tipoMapper,
  });
  const bloqueioRepository = new BloqueioAgendaRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: bloqueioMapper,
  });

  const enricher = new AgendaEnricher({
    unidadeLookup,
    profissionalLookup,
    pacienteLookup,
    tipoAtendimentoRepository,
  });

  const notificacao = new AgendaNotificacaoAdapter({
    dispatcher: dependencies.notification.notificacaoDispatcher,
    cancelarNotificacoes: dependencies.notification.cancelarNotificacoesAgendamento,
  });
  const statusPort = new EstadoAgendamentoNotificacao(notificacao);
  const slotService = new SlotAgendaService();

  const listarAgenda = new ListarAgendaUseCase({ agendamentoRepository, enricher, mapper });
  const obterAgendamento = new ObterAgendamentoUseCase({ agendamentoRepository, enricher, mapper });
  const criarAgendamento = new CriarAgendamentoUseCase({
    agendamentoRepository,
    tipoAtendimentoRepository,
    enricher,
    mapper,
    pacienteLookup,
    unidadeLookup,
    redeLookup,
    notificacao,
  });
  const atualizarAgendamento = new AtualizarAgendamentoUseCase({
    agendamentoRepository,
    tipoAtendimentoRepository,
    enricher,
    mapper,
  });
  const alterarStatus = new AlterarStatusAgendamentoUseCase({
    agendamentoRepository,
    enricher,
    mapper,
    statusPort,
  });
  const cancelarAgendamento = new CancelarAgendamentoUseCase({
    agendamentoRepository,
    enricher,
    mapper,
    statusPort,
    notificacao,
    unidadeLookup,
    redeLookup,
  });
  const registrarChegada = new RegistrarChegadaUseCase({ agendamentoRepository, enricher, mapper });
  const verificarConflito = new VerificarConflitoUseCase({ agendamentoRepository });
  const painelRecepcao = new PainelRecepcaoUseCase({
    agendamentoRepository,
    unidadeLookup,
    enricher,
    mapper,
  });
  const horariosDisponiveis = new ListarHorariosDisponiveisUseCase({
    agendamentoRepository,
    bloqueioRepository,
    tipoAtendimentoRepository,
    unidadeLookup,
    profissionalLookup,
    slotService,
  });

  const listarTiposAtendimento = new ListarTiposAtendimentoUseCase({
    tipoAtendimentoRepository,
    mapper: tipoDtoMapper,
  });
  const criarTipoAtendimento = new CriarTipoAtendimentoUseCase({
    tipoAtendimentoRepository,
    mapper: tipoDtoMapper,
  });
  const atualizarTipoAtendimento = new AtualizarTipoAtendimentoUseCase({
    tipoAtendimentoRepository,
    mapper: tipoDtoMapper,
  });
  const inativarTipoAtendimento = new InativarTipoAtendimentoUseCase({
    tipoAtendimentoRepository,
    mapper: tipoDtoMapper,
  });

  const bloqueioDependencies = {
    bloqueioRepository,
    unidadeLookup,
    profissionalLookup,
    mapper: bloqueioDtoMapper,
  };
  const listarBloqueios = new ListarBloqueiosUseCase(bloqueioDependencies);
  const criarBloqueio = new CriarBloqueioUseCase(bloqueioDependencies);
  const removerBloqueio = new RemoverBloqueioUseCase(bloqueioDependencies);

  const agendaController = new AgendaController({
    listarAgenda,
    obterAgendamento,
    criarAgendamento,
    atualizarAgendamento,
    alterarStatus,
    cancelarAgendamento,
    verificarConflito,
    horariosDisponiveis,
  });
  const recepcaoController = new RecepcaoController({ painelRecepcao, registrarChegada });
  const tipoAtendimentoController = new TipoAtendimentoController({
    listarTiposAtendimento,
    criarTipoAtendimento,
    atualizarTipoAtendimento,
    inativarTipoAtendimento,
  });
  const bloqueioController = new BloqueioController({
    listarBloqueios,
    criarBloqueio,
    removerBloqueio,
  });

  return {
    agendaController,
    recepcaoController,
    tipoAtendimentoController,
    bloqueioController,
    repositories: { agendamentoRepository, tipoAtendimentoRepository, bloqueioRepository },
    services: { slotService, enricher },
    useCases: {
      listarAgenda,
      obterAgendamento,
      criarAgendamento,
      atualizarAgendamento,
      alterarStatus,
      cancelarAgendamento,
      registrarChegada,
      verificarConflito,
      painelRecepcao,
      horariosDisponiveis,
      listarTiposAtendimento,
      criarTipoAtendimento,
      atualizarTipoAtendimento,
      inativarTipoAtendimento,
      listarBloqueios,
      criarBloqueio,
      removerBloqueio,
    },
  };
}

export type SchedulingModule = ReturnType<typeof createSchedulingModule>;
