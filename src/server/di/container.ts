/**
 * Composition root da aplicação (ARCHITECTURE.md §8.4). Nenhuma outra camada
 * instancia implementações concretas: tudo é montado aqui e injetado por
 * objeto de dependências nomeadas.
 */
import type { AppConfig } from '@/server/config/env.config';
import { loadAppConfig } from '@/server/config/env.config';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { createStorageClient } from '@/server/infrastructure/storage/storage.factory';
import type { StorageClient } from '@/server/infrastructure/storage/storage-client.base';

// auth
import { UsuarioMapper } from '@/modules/auth/application/mappers/usuario.mapper';
import { AutenticarUsuarioUseCase } from '@/modules/auth/application/use-cases/autenticar-usuario/autenticar-usuario.use-case';
import { AlterarSenhaUseCase } from '@/modules/auth/application/use-cases/alterar-senha/alterar-senha.use-case';
import { AlternarStatusUsuarioUseCase } from '@/modules/auth/application/use-cases/alternar-status-usuario/alternar-status-usuario.use-case';
import { AtualizarUsuarioUseCase } from '@/modules/auth/application/use-cases/atualizar-usuario/atualizar-usuario.use-case';
import { CriarUsuarioUseCase } from '@/modules/auth/application/use-cases/criar-usuario/criar-usuario.use-case';
import { ListarUsuariosUseCase } from '@/modules/auth/application/use-cases/listar-usuarios/listar-usuarios.use-case';
import { UsuarioPersistenceMapper } from '@/modules/auth/server/infrastructure/persistence/mappers/usuario-persistence.mapper';
import { UsuarioRepositoryImpl } from '@/modules/auth/server/infrastructure/persistence/repositories/usuario.repository.impl';
import { BcryptHashProvider } from '@/modules/auth/server/infrastructure/providers/bcrypt-hash.provider';
import { JwtTokenProvider } from '@/modules/auth/server/infrastructure/providers/jwt-token.provider';

// rede
import { RedeMapper } from '@/modules/rede/application/mappers/rede.mapper';
import { AtualizarRedeUseCase } from '@/modules/rede/application/use-cases/atualizar-rede/atualizar-rede.use-case';
import { AtualizarTemaUseCase } from '@/modules/rede/application/use-cases/atualizar-tema/atualizar-tema.use-case';
import { ObterRedeUseCase } from '@/modules/rede/application/use-cases/obter-rede/obter-rede.use-case';
import { RedePersistenceMapper } from '@/modules/rede/server/infrastructure/persistence/mappers/rede-persistence.mapper';
import { RedeRepositoryImpl } from '@/modules/rede/server/infrastructure/persistence/repositories/rede.repository.impl';

// unidade
import { UnidadeMapper } from '@/modules/unidade/application/mappers/unidade.mapper';
import { AlternarStatusUnidadeUseCase } from '@/modules/unidade/application/use-cases/alternar-status-unidade/alternar-status-unidade.use-case';
import { AtualizarUnidadeUseCase } from '@/modules/unidade/application/use-cases/atualizar-unidade/atualizar-unidade.use-case';
import { CriarUnidadeUseCase } from '@/modules/unidade/application/use-cases/criar-unidade/criar-unidade.use-case';
import { ListarUnidadesUseCase } from '@/modules/unidade/application/use-cases/listar-unidades/listar-unidades.use-case';
import { UnidadePersistenceMapper } from '@/modules/unidade/server/infrastructure/persistence/mappers/unidade-persistence.mapper';
import { UnidadeRepositoryImpl } from '@/modules/unidade/server/infrastructure/persistence/repositories/unidade.repository.impl';

// profissional
import { HorarioAtendimentoMapper } from '@/modules/profissional/application/mappers/horario-atendimento.mapper';
import { ProfissionalMapper } from '@/modules/profissional/application/mappers/profissional.mapper';
import { AlternarStatusProfissionalUseCase } from '@/modules/profissional/application/use-cases/alternar-status-profissional/alternar-status-profissional.use-case';
import { AtualizarProfissionalUseCase } from '@/modules/profissional/application/use-cases/atualizar-profissional/atualizar-profissional.use-case';
import { CriarProfissionalUseCase } from '@/modules/profissional/application/use-cases/criar-profissional/criar-profissional.use-case';
import { DefinirHorariosUseCase } from '@/modules/profissional/application/use-cases/definir-horarios/definir-horarios.use-case';
import { ListarProfissionaisUseCase } from '@/modules/profissional/application/use-cases/listar-profissionais/listar-profissionais.use-case';
import { HorarioPersistenceMapper } from '@/modules/profissional/server/infrastructure/persistence/mappers/horario-persistence.mapper';
import { ProfissionalPersistenceMapper } from '@/modules/profissional/server/infrastructure/persistence/mappers/profissional-persistence.mapper';
import { ProfissionalRepositoryImpl } from '@/modules/profissional/server/infrastructure/persistence/repositories/profissional.repository.impl';

// paciente
import { PacienteMapper } from '@/modules/paciente/application/mappers/paciente.mapper';
import { AlternarStatusPacienteUseCase } from '@/modules/paciente/application/use-cases/alternar-status-paciente/alternar-status-paciente.use-case';
import { AtualizarPacienteUseCase } from '@/modules/paciente/application/use-cases/atualizar-paciente/atualizar-paciente.use-case';
import { CriarPacienteUseCase } from '@/modules/paciente/application/use-cases/criar-paciente/criar-paciente.use-case';
import { ExportarPacienteUseCase } from '@/modules/paciente/application/use-cases/exportar-paciente/exportar-paciente.use-case';
import { ImportarPacientesUseCase } from '@/modules/paciente/application/use-cases/importar-pacientes/importar-pacientes.use-case';
import { ListarPacientesUseCase } from '@/modules/paciente/application/use-cases/listar-pacientes/listar-pacientes.use-case';
import { ObterPacienteUseCase } from '@/modules/paciente/application/use-cases/obter-paciente/obter-paciente.use-case';
import { DetectorDuplicidadeService } from '@/modules/paciente/domain/services/detector-duplicidade.service';
import { PacientePersistenceMapper } from '@/modules/paciente/server/infrastructure/persistence/mappers/paciente-persistence.mapper';
import { ImportacaoPacientesRepositoryImpl } from '@/modules/paciente/server/infrastructure/persistence/repositories/importacao-pacientes.repository.impl';
import { PacienteRepositoryImpl } from '@/modules/paciente/server/infrastructure/persistence/repositories/paciente.repository.impl';

// agenda
import { AgendamentoMapper } from '@/modules/agenda/application/mappers/agendamento.mapper';
import { BloqueioMapper } from '@/modules/agenda/application/mappers/bloqueio.mapper';
import { TipoAtendimentoMapper } from '@/modules/agenda/application/mappers/tipo-atendimento.mapper';
import { AlterarStatusAgendamentoUseCase } from '@/modules/agenda/application/use-cases/alterar-status-agendamento/alterar-status-agendamento.use-case';
import { AtualizarTipoAtendimentoUseCase } from '@/modules/agenda/application/use-cases/atualizar-tipo-atendimento/atualizar-tipo-atendimento.use-case';
import { CriarAgendamentoUseCase } from '@/modules/agenda/application/use-cases/criar-agendamento/criar-agendamento.use-case';
import { CriarBloqueioUseCase } from '@/modules/agenda/application/use-cases/criar-bloqueio/criar-bloqueio.use-case';
import { CriarTipoAtendimentoUseCase } from '@/modules/agenda/application/use-cases/criar-tipo-atendimento/criar-tipo-atendimento.use-case';
import { ListarAgendamentosUseCase } from '@/modules/agenda/application/use-cases/listar-agendamentos/listar-agendamentos.use-case';
import { ListarBloqueiosUseCase } from '@/modules/agenda/application/use-cases/listar-bloqueios/listar-bloqueios.use-case';
import { ListarTiposAtendimentoUseCase } from '@/modules/agenda/application/use-cases/listar-tipos-atendimento/listar-tipos-atendimento.use-case';
import { PainelRecepcaoUseCase } from '@/modules/agenda/application/use-cases/painel-recepcao/painel-recepcao.use-case';
import { RegistrarCheckinUseCase } from '@/modules/agenda/application/use-cases/registrar-checkin/registrar-checkin.use-case';
import { RemoverBloqueioUseCase } from '@/modules/agenda/application/use-cases/remover-bloqueio/remover-bloqueio.use-case';
import { VerificadorConflitoService } from '@/modules/agenda/domain/services/verificador-conflito.service';
import { AgendamentoPersistenceMapper } from '@/modules/agenda/server/infrastructure/persistence/mappers/agendamento-persistence.mapper';
import { BloqueioPersistenceMapper } from '@/modules/agenda/server/infrastructure/persistence/mappers/bloqueio-persistence.mapper';
import { TipoAtendimentoPersistenceMapper } from '@/modules/agenda/server/infrastructure/persistence/mappers/tipo-atendimento-persistence.mapper';
import { AgendaConsultaRepositoryImpl } from '@/modules/agenda/server/infrastructure/persistence/repositories/agenda-consulta.repository.impl';
import { AgendamentoRepositoryImpl } from '@/modules/agenda/server/infrastructure/persistence/repositories/agendamento.repository.impl';
import { BloqueioAgendaRepositoryImpl } from '@/modules/agenda/server/infrastructure/persistence/repositories/bloqueio.repository.impl';
import { TipoAtendimentoRepositoryImpl } from '@/modules/agenda/server/infrastructure/persistence/repositories/tipo-atendimento.repository.impl';

// prontuario
import { AdendoMapper } from '@/modules/prontuario/application/mappers/adendo.mapper';
import { AnexoMapper } from '@/modules/prontuario/application/mappers/anexo.mapper';
import { AtendimentoMapper } from '@/modules/prontuario/application/mappers/atendimento.mapper';
import { TemplateMapper } from '@/modules/prontuario/application/mappers/template.mapper';
import { AdicionarAdendoUseCase } from '@/modules/prontuario/application/use-cases/adicionar-adendo/adicionar-adendo.use-case';
import { AtualizarTemplateUseCase } from '@/modules/prontuario/application/use-cases/atualizar-template/atualizar-template.use-case';
import { CriarTemplateUseCase } from '@/modules/prontuario/application/use-cases/criar-template/criar-template.use-case';
import { FinalizarAtendimentoUseCase } from '@/modules/prontuario/application/use-cases/finalizar-atendimento/finalizar-atendimento.use-case';
import { IniciarAtendimentoUseCase } from '@/modules/prontuario/application/use-cases/iniciar-atendimento/iniciar-atendimento.use-case';
import { ListarAnexosUseCase } from '@/modules/prontuario/application/use-cases/listar-anexos/listar-anexos.use-case';
import { ListarAtendimentosUseCase } from '@/modules/prontuario/application/use-cases/listar-atendimentos/listar-atendimentos.use-case';
import { ListarTemplatesUseCase } from '@/modules/prontuario/application/use-cases/listar-templates/listar-templates.use-case';
import { ObterAtendimentoUseCase } from '@/modules/prontuario/application/use-cases/obter-atendimento/obter-atendimento.use-case';
import { ObterTemplateUseCase } from '@/modules/prontuario/application/use-cases/obter-template/obter-template.use-case';
import { RegistrarAnexoUseCase } from '@/modules/prontuario/application/use-cases/registrar-anexo/registrar-anexo.use-case';
import { RemoverAnexoUseCase } from '@/modules/prontuario/application/use-cases/remover-anexo/remover-anexo.use-case';
import { SalvarAtendimentoUseCase } from '@/modules/prontuario/application/use-cases/salvar-atendimento/salvar-atendimento.use-case';
import { ValidadorPreenchimentoService } from '@/modules/prontuario/domain/services/validador-preenchimento.service';
import { AdendoPersistenceMapper } from '@/modules/prontuario/server/infrastructure/persistence/mappers/adendo-persistence.mapper';
import { AnexoPersistenceMapper } from '@/modules/prontuario/server/infrastructure/persistence/mappers/anexo-persistence.mapper';
import { AtendimentoPersistenceMapper } from '@/modules/prontuario/server/infrastructure/persistence/mappers/atendimento-persistence.mapper';
import { TemplatePersistenceMapper } from '@/modules/prontuario/server/infrastructure/persistence/mappers/template-persistence.mapper';
import { AnexoRepositoryImpl } from '@/modules/prontuario/server/infrastructure/persistence/repositories/anexo.repository.impl';
import { AtendimentoRepositoryImpl } from '@/modules/prontuario/server/infrastructure/persistence/repositories/atendimento.repository.impl';
import { TemplateProntuarioRepositoryImpl } from '@/modules/prontuario/server/infrastructure/persistence/repositories/template.repository.impl';

// documento
import { DocumentoMapper } from '@/modules/documento/application/mappers/documento.mapper';
import { CriarDocumentoUseCase } from '@/modules/documento/application/use-cases/criar-documento/criar-documento.use-case';
import { EmitirDocumentoUseCase } from '@/modules/documento/application/use-cases/emitir-documento/emitir-documento.use-case';
import { ListarDocumentosUseCase } from '@/modules/documento/application/use-cases/listar-documentos/listar-documentos.use-case';
import { ObterDocumentoUseCase } from '@/modules/documento/application/use-cases/obter-documento/obter-documento.use-case';
import { DocumentoPersistenceMapper } from '@/modules/documento/server/infrastructure/persistence/mappers/documento-persistence.mapper';
import { DadosEmissaoRepositoryImpl } from '@/modules/documento/server/infrastructure/persistence/repositories/dados-emissao.repository.impl';
import { DocumentoRepositoryImpl } from '@/modules/documento/server/infrastructure/persistence/repositories/documento.repository.impl';
import { PdfLibGeradorProvider } from '@/modules/documento/server/infrastructure/providers/pdf-lib-gerador.provider';
import { StorageArmazenamentoProvider } from '@/modules/documento/server/infrastructure/providers/storage-armazenamento.provider';

// notificacao
import { NotificacaoMapper } from '@/modules/notificacao/application/mappers/notificacao.mapper';
import { AgendarNotificacaoUseCase } from '@/modules/notificacao/application/use-cases/agendar-notificacao/agendar-notificacao.use-case';
import { GerarLembretesUseCase } from '@/modules/notificacao/application/use-cases/gerar-lembretes/gerar-lembretes.use-case';
import { ListarNotificacoesUseCase } from '@/modules/notificacao/application/use-cases/listar-notificacoes/listar-notificacoes.use-case';
import { ProcessarFilaNotificacoesUseCase } from '@/modules/notificacao/application/use-cases/processar-fila-notificacoes/processar-fila-notificacoes.use-case';
import { ProcessarWebhookWhatsAppUseCase } from '@/modules/notificacao/application/use-cases/processar-webhook-whatsapp/processar-webhook-whatsapp.use-case';
import { FormatadorAgendamentoService } from '@/modules/notificacao/domain/services/formatador-agendamento.service';
import { MontadorMensagemService } from '@/modules/notificacao/domain/services/montador-mensagem.service';
import { NotificacaoPersistenceMapper } from '@/modules/notificacao/server/infrastructure/persistence/mappers/notificacao-persistence.mapper';
import { DestinatarioRepositoryImpl } from '@/modules/notificacao/server/infrastructure/persistence/repositories/destinatario.repository.impl';
import { MensagemWhatsAppRepositoryImpl } from '@/modules/notificacao/server/infrastructure/persistence/repositories/mensagem-whatsapp.repository.impl';
import { NotificacaoRepositoryImpl } from '@/modules/notificacao/server/infrastructure/persistence/repositories/notificacao.repository.impl';
import {
  createEmailProvider,
  createWhatsAppProvider,
} from '@/modules/notificacao/server/infrastructure/providers/notificacao-provider.factory';

// auditoria
import { AuditoriaMapper } from '@/modules/auditoria/application/mappers/auditoria.mapper';
import { ListarAcessosProntuarioUseCase } from '@/modules/auditoria/application/use-cases/listar-acessos-prontuario/listar-acessos-prontuario.use-case';
import { ListarAuditoriaUseCase } from '@/modules/auditoria/application/use-cases/listar-auditoria/listar-auditoria.use-case';
import { RegistrarAcessoProntuarioUseCase } from '@/modules/auditoria/application/use-cases/registrar-acesso-prontuario/registrar-acesso-prontuario.use-case';
import { RegistrarEventoAuditoriaUseCase } from '@/modules/auditoria/application/use-cases/registrar-evento-auditoria/registrar-evento-auditoria.use-case';
import { AuditoriaPersistenceMapper } from '@/modules/auditoria/server/infrastructure/persistence/mappers/auditoria-persistence.mapper';
import { AuditoriaRepositoryImpl } from '@/modules/auditoria/server/infrastructure/persistence/repositories/auditoria.repository.impl';

// relatorio
import { ObterIndicadoresUseCase } from '@/modules/relatorio/application/use-cases/obter-indicadores/obter-indicadores.use-case';
import { RelatorioAtendimentosUseCase } from '@/modules/relatorio/application/use-cases/relatorio-atendimentos/relatorio-atendimentos.use-case';
import { RelatorioFaltasUseCase } from '@/modules/relatorio/application/use-cases/relatorio-faltas/relatorio-faltas.use-case';
import { RelatorioNovosPacientesUseCase } from '@/modules/relatorio/application/use-cases/relatorio-novos-pacientes/relatorio-novos-pacientes.use-case';
import { RelatorioProdutividadeUseCase } from '@/modules/relatorio/application/use-cases/relatorio-produtividade/relatorio-produtividade.use-case';
import { RelatorioRepositoryImpl } from '@/modules/relatorio/server/infrastructure/persistence/repositories/relatorio.repository.impl';

export type ContainerDependencies = { db: DatabaseClient; config?: AppConfig };

/**
 * Container criado por requisição, já com o `DatabaseClient` transacional
 * aberto por `withTenant` (garante o isolamento por rede via RLS).
 */
export class ApplicationContainer {
  public readonly config: AppConfig;
  private readonly db: DatabaseClient;
  private readonly storage: StorageClient;

  constructor(dependencies: ContainerDependencies) {
    this.db = dependencies.db;
    this.config = dependencies.config ?? loadAppConfig();
    this.storage = createStorageClient({ config: this.config.storage });
  }

  // ─────────────────────────────── auth ───────────────────────────────
  private readonly usuarioMapper = new UsuarioMapper();
  private readonly hashProvider = new BcryptHashProvider();

  private get usuarioRepository(): UsuarioRepositoryImpl {
    return new UsuarioRepositoryImpl({ db: this.db, mapper: new UsuarioPersistenceMapper() });
  }

  public get tokenProvider(): JwtTokenProvider {
    return new JwtTokenProvider({ secret: this.config.auth.jwtSecret });
  }

  public get autenticarUsuario(): AutenticarUsuarioUseCase {
    return new AutenticarUsuarioUseCase({
      usuarioRepository: this.usuarioRepository,
      hashProvider: this.hashProvider,
      tokenProvider: this.tokenProvider,
      mapper: this.usuarioMapper,
      sessaoTtlHoras: this.config.auth.sessionTtlHours,
    });
  }

  public get listarUsuarios(): ListarUsuariosUseCase {
    return new ListarUsuariosUseCase({
      usuarioRepository: this.usuarioRepository,
      mapper: this.usuarioMapper,
    });
  }

  public get criarUsuario(): CriarUsuarioUseCase {
    return new CriarUsuarioUseCase({
      usuarioRepository: this.usuarioRepository,
      hashProvider: this.hashProvider,
      mapper: this.usuarioMapper,
    });
  }

  public get atualizarUsuario(): AtualizarUsuarioUseCase {
    return new AtualizarUsuarioUseCase({
      usuarioRepository: this.usuarioRepository,
      mapper: this.usuarioMapper,
    });
  }

  public get alternarStatusUsuario(): AlternarStatusUsuarioUseCase {
    return new AlternarStatusUsuarioUseCase({
      usuarioRepository: this.usuarioRepository,
      mapper: this.usuarioMapper,
    });
  }

  public get alterarSenha(): AlterarSenhaUseCase {
    return new AlterarSenhaUseCase({
      usuarioRepository: this.usuarioRepository,
      hashProvider: this.hashProvider,
    });
  }

  // ─────────────────────────────── rede ───────────────────────────────
  private readonly redeMapper = new RedeMapper();

  private get redeRepository(): RedeRepositoryImpl {
    return new RedeRepositoryImpl({ db: this.db, mapper: new RedePersistenceMapper() });
  }

  public get obterRede(): ObterRedeUseCase {
    return new ObterRedeUseCase({ redeRepository: this.redeRepository, mapper: this.redeMapper });
  }

  public get atualizarRede(): AtualizarRedeUseCase {
    return new AtualizarRedeUseCase({
      redeRepository: this.redeRepository,
      mapper: this.redeMapper,
    });
  }

  public get atualizarTema(): AtualizarTemaUseCase {
    return new AtualizarTemaUseCase({
      redeRepository: this.redeRepository,
      mapper: this.redeMapper,
    });
  }

  // ────────────────────────────── unidade ─────────────────────────────
  private readonly unidadeMapper = new UnidadeMapper();

  private get unidadeRepository(): UnidadeRepositoryImpl {
    return new UnidadeRepositoryImpl({ db: this.db, mapper: new UnidadePersistenceMapper() });
  }

  public get listarUnidades(): ListarUnidadesUseCase {
    return new ListarUnidadesUseCase({
      unidadeRepository: this.unidadeRepository,
      mapper: this.unidadeMapper,
    });
  }

  public get criarUnidade(): CriarUnidadeUseCase {
    return new CriarUnidadeUseCase({
      unidadeRepository: this.unidadeRepository,
      mapper: this.unidadeMapper,
    });
  }

  public get atualizarUnidade(): AtualizarUnidadeUseCase {
    return new AtualizarUnidadeUseCase({
      unidadeRepository: this.unidadeRepository,
      mapper: this.unidadeMapper,
    });
  }

  public get alternarStatusUnidade(): AlternarStatusUnidadeUseCase {
    return new AlternarStatusUnidadeUseCase({
      unidadeRepository: this.unidadeRepository,
      mapper: this.unidadeMapper,
    });
  }

  // ─────────────────────────── profissional ───────────────────────────
  private readonly profissionalMapper = new ProfissionalMapper();
  private readonly horarioMapper = new HorarioAtendimentoMapper();

  private get profissionalRepository(): ProfissionalRepositoryImpl {
    return new ProfissionalRepositoryImpl({
      db: this.db,
      mapper: new ProfissionalPersistenceMapper(),
      horarioMapper: new HorarioPersistenceMapper(),
    });
  }

  public get listarProfissionais(): ListarProfissionaisUseCase {
    return new ListarProfissionaisUseCase({
      profissionalRepository: this.profissionalRepository,
      mapper: this.profissionalMapper,
    });
  }

  public get criarProfissional(): CriarProfissionalUseCase {
    return new CriarProfissionalUseCase({
      profissionalRepository: this.profissionalRepository,
      mapper: this.profissionalMapper,
    });
  }

  public get atualizarProfissional(): AtualizarProfissionalUseCase {
    return new AtualizarProfissionalUseCase({
      profissionalRepository: this.profissionalRepository,
      mapper: this.profissionalMapper,
    });
  }

  public get alternarStatusProfissional(): AlternarStatusProfissionalUseCase {
    return new AlternarStatusProfissionalUseCase({
      profissionalRepository: this.profissionalRepository,
      mapper: this.profissionalMapper,
    });
  }

  public get definirHorarios(): DefinirHorariosUseCase {
    return new DefinirHorariosUseCase({
      profissionalRepository: this.profissionalRepository,
      mapper: this.horarioMapper,
    });
  }

  // ───────────────────────────── paciente ─────────────────────────────
  private readonly pacienteMapper = new PacienteMapper();
  private readonly detectorDuplicidade = new DetectorDuplicidadeService();

  private get pacienteRepository(): PacienteRepositoryImpl {
    return new PacienteRepositoryImpl({ db: this.db, mapper: new PacientePersistenceMapper() });
  }

  private get importacaoRepository(): ImportacaoPacientesRepositoryImpl {
    return new ImportacaoPacientesRepositoryImpl({ db: this.db });
  }

  public get listarPacientes(): ListarPacientesUseCase {
    return new ListarPacientesUseCase({
      pacienteRepository: this.pacienteRepository,
      mapper: this.pacienteMapper,
    });
  }

  public get obterPaciente(): ObterPacienteUseCase {
    return new ObterPacienteUseCase({
      pacienteRepository: this.pacienteRepository,
      mapper: this.pacienteMapper,
    });
  }

  public get criarPaciente(): CriarPacienteUseCase {
    return new CriarPacienteUseCase({
      pacienteRepository: this.pacienteRepository,
      detectorDuplicidade: this.detectorDuplicidade,
      mapper: this.pacienteMapper,
    });
  }

  public get atualizarPaciente(): AtualizarPacienteUseCase {
    return new AtualizarPacienteUseCase({
      pacienteRepository: this.pacienteRepository,
      mapper: this.pacienteMapper,
    });
  }

  public get alternarStatusPaciente(): AlternarStatusPacienteUseCase {
    return new AlternarStatusPacienteUseCase({
      pacienteRepository: this.pacienteRepository,
      mapper: this.pacienteMapper,
    });
  }

  public get importarPacientes(): ImportarPacientesUseCase {
    return new ImportarPacientesUseCase({
      pacienteRepository: this.pacienteRepository,
      importacaoRepository: this.importacaoRepository,
      detectorDuplicidade: this.detectorDuplicidade,
    });
  }

  public get exportarPaciente(): ExportarPacienteUseCase {
    return new ExportarPacienteUseCase({
      pacienteRepository: this.pacienteRepository,
      mapper: this.pacienteMapper,
    });
  }

  // ────────────────────────────── agenda ──────────────────────────────
  private readonly agendamentoMapper = new AgendamentoMapper();
  private readonly tipoAtendimentoMapper = new TipoAtendimentoMapper();
  private readonly bloqueioMapper = new BloqueioMapper();
  private readonly verificadorConflito = new VerificadorConflitoService();

  private get agendamentoRepository(): AgendamentoRepositoryImpl {
    return new AgendamentoRepositoryImpl({
      db: this.db,
      mapper: new AgendamentoPersistenceMapper(),
    });
  }

  private get tipoAtendimentoRepository(): TipoAtendimentoRepositoryImpl {
    return new TipoAtendimentoRepositoryImpl({
      db: this.db,
      mapper: new TipoAtendimentoPersistenceMapper(),
    });
  }

  private get bloqueioRepository(): BloqueioAgendaRepositoryImpl {
    return new BloqueioAgendaRepositoryImpl({
      db: this.db,
      mapper: new BloqueioPersistenceMapper(),
    });
  }

  private get agendaConsultaRepository(): AgendaConsultaRepositoryImpl {
    return new AgendaConsultaRepositoryImpl({ db: this.db });
  }

  public get listarAgendamentos(): ListarAgendamentosUseCase {
    return new ListarAgendamentosUseCase({
      consultaRepository: this.agendaConsultaRepository,
      bloqueioRepository: this.bloqueioRepository,
      bloqueioMapper: this.bloqueioMapper,
    });
  }

  public get criarAgendamento(): CriarAgendamentoUseCase {
    return new CriarAgendamentoUseCase({
      agendamentoRepository: this.agendamentoRepository,
      tipoAtendimentoRepository: this.tipoAtendimentoRepository,
      bloqueioRepository: this.bloqueioRepository,
      verificadorConflito: this.verificadorConflito,
      mapper: this.agendamentoMapper,
    });
  }

  public get alterarStatusAgendamento(): AlterarStatusAgendamentoUseCase {
    return new AlterarStatusAgendamentoUseCase({
      agendamentoRepository: this.agendamentoRepository,
      mapper: this.agendamentoMapper,
    });
  }

  public get registrarCheckin(): RegistrarCheckinUseCase {
    return new RegistrarCheckinUseCase({
      agendamentoRepository: this.agendamentoRepository,
      mapper: this.agendamentoMapper,
    });
  }

  public get painelRecepcao(): PainelRecepcaoUseCase {
    return new PainelRecepcaoUseCase({ consultaRepository: this.agendaConsultaRepository });
  }

  public get listarTiposAtendimento(): ListarTiposAtendimentoUseCase {
    return new ListarTiposAtendimentoUseCase({
      tipoAtendimentoRepository: this.tipoAtendimentoRepository,
      mapper: this.tipoAtendimentoMapper,
    });
  }

  public get criarTipoAtendimento(): CriarTipoAtendimentoUseCase {
    return new CriarTipoAtendimentoUseCase({
      tipoAtendimentoRepository: this.tipoAtendimentoRepository,
      mapper: this.tipoAtendimentoMapper,
    });
  }

  public get atualizarTipoAtendimento(): AtualizarTipoAtendimentoUseCase {
    return new AtualizarTipoAtendimentoUseCase({
      tipoAtendimentoRepository: this.tipoAtendimentoRepository,
      mapper: this.tipoAtendimentoMapper,
    });
  }

  public get listarBloqueios(): ListarBloqueiosUseCase {
    return new ListarBloqueiosUseCase({
      bloqueioRepository: this.bloqueioRepository,
      mapper: this.bloqueioMapper,
    });
  }

  public get criarBloqueio(): CriarBloqueioUseCase {
    return new CriarBloqueioUseCase({
      bloqueioRepository: this.bloqueioRepository,
      agendamentoRepository: this.agendamentoRepository,
      mapper: this.bloqueioMapper,
    });
  }

  public get removerBloqueio(): RemoverBloqueioUseCase {
    return new RemoverBloqueioUseCase({ bloqueioRepository: this.bloqueioRepository });
  }

  // ──────────────────────────── prontuário ────────────────────────────
  private readonly templateMapper = new TemplateMapper();
  private readonly atendimentoMapper = new AtendimentoMapper();
  private readonly adendoMapper = new AdendoMapper();
  private readonly anexoMapper = new AnexoMapper();
  private readonly validadorPreenchimento = new ValidadorPreenchimentoService();

  private get templateRepository(): TemplateProntuarioRepositoryImpl {
    return new TemplateProntuarioRepositoryImpl({
      db: this.db,
      mapper: new TemplatePersistenceMapper(),
    });
  }

  private get atendimentoRepository(): AtendimentoRepositoryImpl {
    return new AtendimentoRepositoryImpl({
      db: this.db,
      mapper: new AtendimentoPersistenceMapper(),
      adendoMapper: new AdendoPersistenceMapper(),
    });
  }

  private get anexoRepository(): AnexoRepositoryImpl {
    return new AnexoRepositoryImpl({ db: this.db, mapper: new AnexoPersistenceMapper() });
  }

  public get listarTemplates(): ListarTemplatesUseCase {
    return new ListarTemplatesUseCase({
      templateRepository: this.templateRepository,
      mapper: this.templateMapper,
    });
  }

  public get obterTemplate(): ObterTemplateUseCase {
    return new ObterTemplateUseCase({
      templateRepository: this.templateRepository,
      mapper: this.templateMapper,
    });
  }

  public get criarTemplate(): CriarTemplateUseCase {
    return new CriarTemplateUseCase({
      templateRepository: this.templateRepository,
      mapper: this.templateMapper,
    });
  }

  public get atualizarTemplate(): AtualizarTemplateUseCase {
    return new AtualizarTemplateUseCase({
      templateRepository: this.templateRepository,
      mapper: this.templateMapper,
    });
  }

  public get iniciarAtendimento(): IniciarAtendimentoUseCase {
    return new IniciarAtendimentoUseCase({
      atendimentoRepository: this.atendimentoRepository,
      templateRepository: this.templateRepository,
      atendimentoMapper: this.atendimentoMapper,
      templateMapper: this.templateMapper,
    });
  }

  public get salvarAtendimento(): SalvarAtendimentoUseCase {
    return new SalvarAtendimentoUseCase({
      atendimentoRepository: this.atendimentoRepository,
      templateRepository: this.templateRepository,
      validadorPreenchimento: this.validadorPreenchimento,
      mapper: this.atendimentoMapper,
    });
  }

  public get finalizarAtendimento(): FinalizarAtendimentoUseCase {
    return new FinalizarAtendimentoUseCase({
      atendimentoRepository: this.atendimentoRepository,
      templateRepository: this.templateRepository,
      validadorPreenchimento: this.validadorPreenchimento,
      mapper: this.atendimentoMapper,
    });
  }

  public get obterAtendimento(): ObterAtendimentoUseCase {
    return new ObterAtendimentoUseCase({
      atendimentoRepository: this.atendimentoRepository,
      templateRepository: this.templateRepository,
      anexoRepository: this.anexoRepository,
      atendimentoMapper: this.atendimentoMapper,
      templateMapper: this.templateMapper,
      adendoMapper: this.adendoMapper,
      anexoMapper: this.anexoMapper,
    });
  }

  public get listarAtendimentos(): ListarAtendimentosUseCase {
    return new ListarAtendimentosUseCase({
      atendimentoRepository: this.atendimentoRepository,
      mapper: this.atendimentoMapper,
    });
  }

  public get adicionarAdendo(): AdicionarAdendoUseCase {
    return new AdicionarAdendoUseCase({
      atendimentoRepository: this.atendimentoRepository,
      mapper: this.adendoMapper,
    });
  }

  public get registrarAnexo(): RegistrarAnexoUseCase {
    return new RegistrarAnexoUseCase({
      anexoRepository: this.anexoRepository,
      mapper: this.anexoMapper,
    });
  }

  public get listarAnexos(): ListarAnexosUseCase {
    return new ListarAnexosUseCase({
      anexoRepository: this.anexoRepository,
      mapper: this.anexoMapper,
    });
  }

  public get removerAnexo(): RemoverAnexoUseCase {
    return new RemoverAnexoUseCase({ anexoRepository: this.anexoRepository });
  }

  // ───────────────────────────── documento ────────────────────────────
  private readonly documentoMapper = new DocumentoMapper();
  private readonly geradorPdf = new PdfLibGeradorProvider();

  public get armazenamento(): StorageArmazenamentoProvider {
    return new StorageArmazenamentoProvider({ storage: this.storage });
  }

  private get documentoRepository(): DocumentoRepositoryImpl {
    return new DocumentoRepositoryImpl({ db: this.db, mapper: new DocumentoPersistenceMapper() });
  }

  private get dadosEmissaoRepository(): DadosEmissaoRepositoryImpl {
    return new DadosEmissaoRepositoryImpl({ db: this.db });
  }

  public get listarDocumentos(): ListarDocumentosUseCase {
    return new ListarDocumentosUseCase({
      documentoRepository: this.documentoRepository,
      mapper: this.documentoMapper,
    });
  }

  public get obterDocumento(): ObterDocumentoUseCase {
    return new ObterDocumentoUseCase({
      documentoRepository: this.documentoRepository,
      armazenamento: this.armazenamento,
      mapper: this.documentoMapper,
    });
  }

  public get criarDocumento(): CriarDocumentoUseCase {
    return new CriarDocumentoUseCase({
      documentoRepository: this.documentoRepository,
      mapper: this.documentoMapper,
    });
  }

  public get emitirDocumento(): EmitirDocumentoUseCase {
    return new EmitirDocumentoUseCase({
      documentoRepository: this.documentoRepository,
      dadosEmissaoRepository: this.dadosEmissaoRepository,
      geradorPdf: this.geradorPdf,
      armazenamento: this.armazenamento,
      mapper: this.documentoMapper,
    });
  }

  // ──────────────────────────── notificação ───────────────────────────
  private readonly notificacaoMapper = new NotificacaoMapper();
  private readonly montadorMensagem = new MontadorMensagemService();
  private readonly formatadorAgendamento = new FormatadorAgendamentoService();

  private get notificacaoRepository(): NotificacaoRepositoryImpl {
    return new NotificacaoRepositoryImpl({
      db: this.db,
      mapper: new NotificacaoPersistenceMapper(),
    });
  }

  private get destinatarioRepository(): DestinatarioRepositoryImpl {
    return new DestinatarioRepositoryImpl({ db: this.db });
  }

  private get mensagemWhatsAppRepository(): MensagemWhatsAppRepositoryImpl {
    return new MensagemWhatsAppRepositoryImpl({ db: this.db });
  }

  public get agendarNotificacao(): AgendarNotificacaoUseCase {
    return new AgendarNotificacaoUseCase({
      notificacaoRepository: this.notificacaoRepository,
      destinatarioRepository: this.destinatarioRepository,
      montadorMensagem: this.montadorMensagem,
      formatadorAgendamento: this.formatadorAgendamento,
      mapper: this.notificacaoMapper,
    });
  }

  public get listarNotificacoes(): ListarNotificacoesUseCase {
    return new ListarNotificacoesUseCase({
      notificacaoRepository: this.notificacaoRepository,
      mapper: this.notificacaoMapper,
    });
  }

  public get gerarLembretes(): GerarLembretesUseCase {
    return new GerarLembretesUseCase({
      notificacaoRepository: this.notificacaoRepository,
      destinatarioRepository: this.destinatarioRepository,
      montadorMensagem: this.montadorMensagem,
      formatadorAgendamento: this.formatadorAgendamento,
    });
  }

  public get processarFilaNotificacoes(): ProcessarFilaNotificacoesUseCase {
    return new ProcessarFilaNotificacoesUseCase({
      notificacaoRepository: this.notificacaoRepository,
      destinatarioRepository: this.destinatarioRepository,
      mensagemWhatsAppRepository: this.mensagemWhatsAppRepository,
      emailProvider: createEmailProvider({ config: this.config.smtp }),
      whatsappProvider: createWhatsAppProvider({ config: this.config.whatsapp }),
      montadorMensagem: this.montadorMensagem,
    });
  }

  public get processarWebhookWhatsApp(): ProcessarWebhookWhatsAppUseCase {
    return new ProcessarWebhookWhatsAppUseCase({
      whatsappProvider: createWhatsAppProvider({ config: this.config.whatsapp }),
      mensagemWhatsAppRepository: this.mensagemWhatsAppRepository,
    });
  }

  // ───────────────────────────── auditoria ────────────────────────────
  private readonly auditoriaMapper = new AuditoriaMapper();

  private get auditoriaRepository(): AuditoriaRepositoryImpl {
    return new AuditoriaRepositoryImpl({ db: this.db, mapper: new AuditoriaPersistenceMapper() });
  }

  public get registrarEventoAuditoria(): RegistrarEventoAuditoriaUseCase {
    return new RegistrarEventoAuditoriaUseCase({ auditoriaRepository: this.auditoriaRepository });
  }

  public get listarAuditoria(): ListarAuditoriaUseCase {
    return new ListarAuditoriaUseCase({
      auditoriaRepository: this.auditoriaRepository,
      mapper: this.auditoriaMapper,
    });
  }

  public get registrarAcessoProntuario(): RegistrarAcessoProntuarioUseCase {
    return new RegistrarAcessoProntuarioUseCase({
      auditoriaRepository: this.auditoriaRepository,
    });
  }

  public get listarAcessosProntuario(): ListarAcessosProntuarioUseCase {
    return new ListarAcessosProntuarioUseCase({ auditoriaRepository: this.auditoriaRepository });
  }

  // ───────────────────────────── relatório ────────────────────────────
  private get relatorioRepository(): RelatorioRepositoryImpl {
    return new RelatorioRepositoryImpl({ db: this.db });
  }

  public get obterIndicadores(): ObterIndicadoresUseCase {
    return new ObterIndicadoresUseCase({ relatorioRepository: this.relatorioRepository });
  }

  public get relatorioAtendimentos(): RelatorioAtendimentosUseCase {
    return new RelatorioAtendimentosUseCase({ relatorioRepository: this.relatorioRepository });
  }

  public get relatorioFaltas(): RelatorioFaltasUseCase {
    return new RelatorioFaltasUseCase({ relatorioRepository: this.relatorioRepository });
  }

  public get relatorioNovosPacientes(): RelatorioNovosPacientesUseCase {
    return new RelatorioNovosPacientesUseCase({ relatorioRepository: this.relatorioRepository });
  }

  public get relatorioProdutividade(): RelatorioProdutividadeUseCase {
    return new RelatorioProdutividadeUseCase({ relatorioRepository: this.relatorioRepository });
  }
}
