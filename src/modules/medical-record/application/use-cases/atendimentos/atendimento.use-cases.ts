import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IUseCase } from '@core/application/use-case.interface';
import { Atendimento } from '../../../domain/entities/atendimento.entity';
import {
  AtendimentoDuplicadoError,
  AtendimentoFinalizadoError,
  AtendimentoNotFoundError,
  DadosInvalidosError,
} from '../../../domain/errors/prontuario.errors';
import type { IAtendimentoRepository } from '../../../domain/repositories/prontuario-repositories.interface';
import type { ITemplateProntuarioRepository } from '../../../domain/repositories/prontuario-repositories.interface';
import { EstruturaTemplate } from '../../../domain/value-objects/estrutura-template.vo';
import { camposFixosPadrao } from '../../../domain/value-objects/campos-fixos.vo';
import type { AtendimentoMapper, EnriquecimentoAtendimento } from '../../mappers/prontuario.mapper';
import type { RegistrarAcessoProntuario } from '@/modules/audit/domain/services/log-acesso-prontuario.interface';
import type { RegistrarAuditoriaInputDto } from '@/modules/audit/application/use-cases/registrar-auditoria/registrar-auditoria.input.dto';
import type { RegistrarAuditoriaOutputDto } from '@/modules/audit/application/use-cases/registrar-auditoria/registrar-auditoria.output.dto';
import type {
  IniciarAtendimentoInputDto,
  IniciarAtendimentoOutputDto,
  ObterAtendimentoInputDto,
  ObterAtendimentoOutputDto,
  SalvarRascunhoInputDto,
  SalvarRascunhoOutputDto,
} from '../../dtos/prontuario.dto';

export type RegistrarAuditoria = IUseCase<RegistrarAuditoriaInputDto, RegistrarAuditoriaOutputDto>;

/** Porta do log de acesso ao prontuário exigido pela LGPD (§5). */
export type { RegistrarAcessoProntuario } from '@/modules/audit/domain/services/log-acesso-prontuario.interface';

export type AtendimentoUseCasesDependencies = {
  atendimentoRepository: IAtendimentoRepository;
  templateRepository: ITemplateProntuarioRepository;
  mapper: AtendimentoMapper;
  /** Trilha de auditoria das ações sensíveis do prontuário (§5). */
  auditoria?: RegistrarAuditoria;
  /** Log de leitura do prontuário — LGPD (§5). */
  registrarAcesso?: RegistrarAcessoProntuario;
  enricher?: { enriquecer: (params: { atendimentos: Atendimento[] }) => Promise<Map<string, EnriquecimentoAtendimento>> };
};

/**
 * Abre a entrada do prontuário do atendimento. Se vier de um agendamento, o
 * vínculo é único — o segundo POST do mesmo agendamento é rejeitado.
 */
export class IniciarAtendimentoUseCase extends UseCase<
  IniciarAtendimentoInputDto,
  IniciarAtendimentoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: AtendimentoMapper;
  private readonly auditoria?: RegistrarAuditoria;

  constructor(dependencies: AtendimentoUseCasesDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
    this.auditoria = dependencies.auditoria;
  }

  async execute(input: IniciarAtendimentoInputDto): Promise<Result<IniciarAtendimentoOutputDto>> {
    if (input.agendamentoId) {
      const existente = await this.atendimentoRepository.findByAgendamentoId(input.agendamentoId);
      if (existente) {
        return Result.fail(new AtendimentoDuplicadoError({ agendamentoId: input.agendamentoId }));
      }
    }

    const template = await this.resolverTemplate(input);

    const atendimentoResult = Atendimento.create({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      pacienteId: input.pacienteId,
      profissionalId: input.profissionalId,
      agendamentoId: input.agendamentoId,
      tipoAtendimentoId: input.tipoAtendimentoId,
      templateId: template?.id ?? null,
      templateVersao: template?.versao ?? null,
      fontePagadora: input.fontePagadora,
      camposFixos: input.camposFixos,
      createdBy: input.createdBy,
    });
    if (atendimentoResult.isFailure) return Result.fail(atendimentoResult.error);

    const atendimento = atendimentoResult.value;
    await this.atendimentoRepository.save(atendimento);

    await this.registrarAuditoria({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      usuarioId: input.createdBy ?? null,
      acao: 'criar',
      entidade: 'atendimentos',
      registroId: atendimento.id.toString(),
      descricao: 'Abertura de atendimento no prontuário',
      dadosDepois: { pacienteId: input.pacienteId, profissionalId: input.profissionalId },
    });

    return Result.ok(this.mapper.map({ atendimento }));
  }

  /** Template explícito ou o padrão (ativo) da especialidade do profissional. */
  private async resolverTemplate(
    input: IniciarAtendimentoInputDto,
  ): Promise<{ id: string; versao: number } | null> {
    if (input.templateId) {
      const template = await this.templateRepository.findById(input.templateId);
      if (template) return { id: template.id.toString(), versao: template.versao };
    }

    if (!input.especialidade) return null;

    const templates = await this.templateRepository.listar({
      redeId: input.redeId,
      especialidade: input.especialidade,
      somenteAtivos: true,
    });

    const padrao = templates.find((item) => item.isPadrao) ?? templates[0];
    return padrao ? { id: padrao.id.toString(), versao: padrao.versao } : null;
  }

  private async registrarAuditoria(
    params: Parameters<RegistrarAuditoria['execute']>[0],
  ): Promise<void> {
    if (!this.auditoria) return;
    await this.auditoria.execute(params);
  }
}

export class ObterAtendimentoUseCase extends UseCase<ObterAtendimentoInputDto, ObterAtendimentoOutputDto> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: AtendimentoMapper;
  private readonly enricher?: AtendimentoUseCasesDependencies['enricher'];
  private readonly registrarAcesso?: RegistrarAcessoProntuario;

  constructor(dependencies: AtendimentoUseCasesDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
    this.enricher = dependencies.enricher;
    this.registrarAcesso = dependencies.registrarAcesso;
  }

  async execute(input: ObterAtendimentoInputDto): Promise<Result<ObterAtendimentoOutputDto>> {
    const atendimento = await this.atendimentoRepository.findById(input.atendimentoId);
    if (!atendimento) return Result.fail(new AtendimentoNotFoundError({ atendimentoId: input.atendimentoId }));

    // LGPD (§5): toda leitura do prontuário é registrada na trilha de auditoria.
    await this.registrarAcesso?.({
      pacienteId: atendimento.pacienteId,
      atendimentoId: atendimento.id.toString(),
      unidadeId: atendimento.unidadeId,
    });

    const enriquecimento = this.enricher
      ? (await this.enricher.enriquecer({ atendimentos: [atendimento] })).get(atendimento.id.toString())
      : undefined;

    const template = atendimento.templateId
      ? await this.templateRepository.findById(atendimento.templateId)
      : null;

    return Result.ok({
      atendimento: this.mapper.map({ atendimento, enriquecimento }),
      evolucoes: [],
      estrutura: template ? template.estrutura.toJSON() : null,
      camposFixos: camposFixosPadrao(),
    });
  }
}

/**
 * Salva o rascunho do atendimento. Valida os dados contra a versão do template
 * gravada na abertura; campos opcionais ainda vazios geram avisos, não erros.
 */
export class SalvarRascunhoAtendimentoUseCase extends UseCase<
  SalvarRascunhoInputDto,
  SalvarRascunhoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: AtendimentoMapper;

  constructor(dependencies: AtendimentoUseCasesDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: SalvarRascunhoInputDto): Promise<Result<SalvarRascunhoOutputDto>> {
    const atendimento = await this.atendimentoRepository.findById(input.atendimentoId);
    if (!atendimento) return Result.fail(new AtendimentoNotFoundError({ atendimentoId: input.atendimentoId }));

    if (atendimento.estaFinalizado()) {
      return Result.fail(new AtendimentoFinalizadoError({ atendimentoId: input.atendimentoId }));
    }

    const templateId = input.templateId ?? atendimento.templateId;
    const template = templateId ? await this.templateRepository.findById(templateId) : null;
    const estrutura = template ? template.estrutura : null;

    const atualizacao = atendimento.atualizarRascunho({
      camposFixos: input.camposFixos,
      dadosPreenchidos: input.dadosPreenchidos,
      fontePagadora: input.fontePagadora,
      templateId: input.templateId,
      templateVersao: template?.versao ?? null,
    });
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    const problemas = estrutura
      ? atendimento.dadosPreenchidos.validar({ estrutura, exigirObrigatorios: false })
      : [];

    await this.atendimentoRepository.update(atendimento);

    return Result.ok({
      atendimento: this.mapper.map({ atendimento }),
      avisos: problemas.map((problema) => `${problema.rotulo}: ${problema.motivo}`),
    });
  }
}

/** Finaliza o atendimento — depois disso só adendos (§3.5). */
export class FinalizarAtendimentoUseCase extends UseCase<
  { atendimentoId: string; usuarioId: string },
  IniciarAtendimentoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly templateRepository: ITemplateProntuarioRepository;
  private readonly mapper: AtendimentoMapper;
  private readonly auditoria?: RegistrarAuditoria;

  constructor(dependencies: AtendimentoUseCasesDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.templateRepository = dependencies.templateRepository;
    this.mapper = dependencies.mapper;
    this.auditoria = dependencies.auditoria;
  }

  async execute(input: { atendimentoId: string; usuarioId: string }): Promise<Result<IniciarAtendimentoOutputDto>> {
    const atendimento = await this.atendimentoRepository.findById(input.atendimentoId);
    if (!atendimento) return Result.fail(new AtendimentoNotFoundError({ atendimentoId: input.atendimentoId }));

    if (atendimento.estaFinalizado()) {
      return Result.fail(new AtendimentoFinalizadoError({ atendimentoId: input.atendimentoId }));
    }

    const template = atendimento.templateId
      ? await this.templateRepository.findById(atendimento.templateId)
      : null;
    const estrutura: EstruturaTemplate | null = template ? template.estrutura : null;

    const finalizacao = atendimento.finalizar({ por: input.usuarioId, estrutura });
    if (finalizacao.isFailure) return Result.fail(finalizacao.error);

    await this.atendimentoRepository.update(atendimento);

    if (this.auditoria) {
      await this.auditoria.execute({
        redeId: atendimento.redeId,
        unidadeId: atendimento.unidadeId,
        usuarioId: input.usuarioId,
        acao: 'atualizar',
        entidade: 'atendimentos',
        registroId: atendimento.id.toString(),
        descricao: 'Finalização do atendimento (prontuário imutável)',
        dadosDepois: { status: 'finalizado', finalizadoEm: atendimento.finalizadoEm?.toISOString() ?? null },
      });
    }

    return Result.ok(this.mapper.map({ atendimento }));
  }
}

export class CancelarAtendimentoUseCase extends UseCase<
  { atendimentoId: string; motivo: string },
  IniciarAtendimentoOutputDto
> {
  private readonly atendimentoRepository: IAtendimentoRepository;
  private readonly mapper: AtendimentoMapper;

  constructor(dependencies: AtendimentoUseCasesDependencies) {
    super();
    this.atendimentoRepository = dependencies.atendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: { atendimentoId: string; motivo: string }): Promise<Result<IniciarAtendimentoOutputDto>> {
    const atendimento = await this.atendimentoRepository.findById(input.atendimentoId);
    if (!atendimento) return Result.fail(new AtendimentoNotFoundError({ atendimentoId: input.atendimentoId }));

    const cancelamento = atendimento.cancelar({ motivo: input.motivo });
    if (cancelamento.isFailure) return Result.fail(cancelamento.error);

    await this.atendimentoRepository.update(atendimento);

    return Result.ok(this.mapper.map({ atendimento }));
  }
}

export { DadosInvalidosError };
