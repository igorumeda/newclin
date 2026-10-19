import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { normalizePagination } from '@core/application/pagination/pagination';
import { Documento } from '../../../domain/entities/documento.entity';
import {
  DocumentoFinalizadoError,
  DocumentoNotFoundError,
  TipoDocumentoNaoPermitidoError,
} from '../../../domain/errors/documento.errors';
import type { IDocumentoRepository } from '../../../domain/repositories/documento-repository.interface';
import type {
  IDocumentoPdf,
  IDocumentoStorage,
} from '../../../domain/services/documento-ports.interface';
import type { IProfissionalReader } from '../../../domain/services/profissional-reader.interface';
import {
  TIPOS_DOCUMENTO_RECEPCAO,
  TIPO_DOCUMENTO_LABELS,
  type TipoDocumento,
} from '../../../domain/value-objects/tipo-documento.vo';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IRedeLookup } from '@/modules/organization/domain/services/rede-lookup.interface';
import type { IPacienteLookup } from '@/modules/patient/domain/services/paciente-lookup.interface';
import type { IProntuarioLookup } from '@/modules/medical-record/domain/services/prontuario-lookup.interface';
import type { NotificacaoDispatcher } from '@/modules/notification/application/services/notificacao-dispatcher.service';
import { DocumentoMapper } from '../../mappers/documento.mapper';
import type { EnriquecimentoDocumento } from '../../mappers/documento.mapper';
import type {
  AtualizarDocumentoInputDto,
  AtualizarDocumentoOutputDto,
  CancelarDocumentoInputDto,
  CancelarDocumentoOutputDto,
  CriarDocumentoInputDto,
  CriarDocumentoOutputDto,
  DocumentoDto,
  EmitirDocumentoInputDto,
  EmitirDocumentoOutputDto,
  ListarDocumentosInputDto,
  ListarDocumentosOutputDto,
  ObterDocumentoInputDto,
  ObterDocumentoOutputDto,
  ObterLinkDocumentoInputDto,
  ObterLinkDocumentoOutputDto,
  PrevisualizarDocumentoOutputDto,
} from '../../dtos/documento.dto';

export type DocumentoUseCaseDependencies = {
  documentoRepository: IDocumentoRepository;
  storage: IDocumentoStorage;
  pdf: IDocumentoPdf;
  mapper: DocumentoMapper;
  unidadeLookup: IUnidadeLookup;
  redeLookup: IRedeLookup;
  pacienteLookup: IPacienteLookup;
  prontuarioLookup: IProntuarioLookup;
  profissionalReader: IProfissionalReader;
  notification?: NotificacaoDispatcher;
};

/** Cabeçalho + paciente + profissional: base do PDF e da pré-visualização. */
type ContextoDocumento = {
  cabecalho: {
    redeNome: string;
    unidadeNome: string;
    unidadeEndereco: string;
    unidadeTelefone: string;
    logotipoUrl: string | null;
  };
  paciente: {
    nome: string;
    cpfFormatado: string;
    dataNascimento: string;
    idade: number;
    sexoLabel: string;
    telefone: string | null;
    email: string | null;
  };
  profissional: {
    nome: string;
    especialidade: string;
    conselhoClasse: string | null;
    numeroConselho: string | null;
  };
};

async function montarContexto(
  dependencies: DocumentoUseCaseDependencies,
  params: { redeId: string; unidadeId: string; pacienteId: string; profissionalId: string },
): Promise<Result<ContextoDocumento>> {
  const [rede, unidade, paciente, profissional] = await Promise.all([
    dependencies.redeLookup.findById(params.redeId),
    dependencies.unidadeLookup.findById(params.unidadeId),
    dependencies.pacienteLookup.findById(params.pacienteId),
    dependencies.profissionalReader.findById(params.profissionalId),
  ]);

  if (!unidade) return Result.fail(new Error('Unidade não encontrada para emissão do documento'));
  if (!paciente) return Result.fail(new Error('Paciente não encontrado para emissão do documento'));
  if (!profissional) return Result.fail(new Error('Profissional não encontrado para emissão do documento'));

  return Result.ok({
    cabecalho: {
      redeNome: rede?.nome ?? 'Clínica',
      unidadeNome: unidade.nome,
      unidadeEndereco: unidade.enderecoCompleto,
      unidadeTelefone: unidade.telefone ?? '',
      logotipoUrl: rede?.logotipoUrl ?? null,
    },
    paciente: {
      nome: paciente.nome,
      cpfFormatado: paciente.cpfFormatado,
      dataNascimento: paciente.dataNascimento,
      idade: paciente.idade,
      sexoLabel: paciente.sexoLabel,
      telefone: paciente.telefone,
      email: paciente.email,
    },
    profissional: {
      nome: profissional.nome,
      especialidade: profissional.especialidade,
      conselhoClasse: profissional.conselhoClasse,
      numeroConselho: profissional.numeroConselho,
    },
  });
}

export class CriarDocumentoUseCase extends UseCase<CriarDocumentoInputDto, CriarDocumentoOutputDto> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: CriarDocumentoInputDto): Promise<Result<CriarDocumentoOutputDto>> {
    const permissao = this.verificarPermissao(input.tipo, input.papel ?? null);
    if (permissao.isFailure) return Result.fail(permissao.error);

    if (input.atendimentoId) {
      const atendimento = await this.dependencies.prontuarioLookup.findAtendimentoById(input.atendimentoId);
      if (!atendimento) return Result.fail(new Error('Atendimento não encontrado para vincular o documento'));
      if (atendimento.pacienteId !== input.pacienteId) {
        return Result.fail(new Error('O atendimento informado pertence a outro paciente'));
      }
    }

    const documentoResult = Documento.create(input);
    if (documentoResult.isFailure) return Result.fail(documentoResult.error);

    const documento = documentoResult.value;
    await this.dependencies.documentoRepository.save(documento);

    const proximoNumero = await this.dependencies.documentoRepository.proximoNumero({
      redeId: input.redeId,
      tipo: input.tipo,
    });

    const enriquecimento = await this.enriquecer([documento]);

    return Result.ok(
      this.dependencies.mapper.map({
        documento,
        enriquecimento: enriquecimento.get(documento.id.toString()),
        proximoNumero,
      }),
    );
  }

  private verificarPermissao(tipo: TipoDocumento, papel: string | null): Result<void> {
    if (papel !== 'recepcao') return Result.ok();
    if (TIPOS_DOCUMENTO_RECEPCAO.includes(tipo)) return Result.ok();

    return Result.fail(
      new TipoDocumentoNaoPermitidoError({
        tipo: TIPO_DOCUMENTO_LABELS[tipo],
        motivo: 'a recepção emite apenas declaração de comparecimento',
      }),
    );
  }

  private async enriquecer(documentos: Documento[]): Promise<Map<string, EnriquecimentoDocumento>> {
    const pacientes = await this.dependencies.pacienteLookup.listarPorIds([
      ...new Set(documentos.map((documento) => documento.pacienteId)),
    ]);
    const porId = new Map(pacientes.map((paciente) => [paciente.id, paciente.nome]));

    return new Map(
      documentos.map((documento) => [
        documento.id.toString(),
        {
          pacienteNome: porId.get(documento.pacienteId) ?? null,
          profissionalNome: null,
          unidadeNome: null,
        },
      ]),
    );
  }
}

export class AtualizarDocumentoUseCase extends UseCase<
  AtualizarDocumentoInputDto,
  AtualizarDocumentoOutputDto
> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: AtualizarDocumentoInputDto): Promise<Result<AtualizarDocumentoOutputDto>> {
    const documento = await this.dependencies.documentoRepository.findById(input.documentoId);
    if (!documento) return Result.fail(new DocumentoNotFoundError({ documentoId: input.documentoId }));

    const atualizacao = documento.atualizarConteudo(input.conteudo);
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.dependencies.documentoRepository.update(documento);

    return Result.ok(this.dependencies.mapper.map({ documento }));
  }
}

/**
 * Emissão (§3.6): valida o conteúdo, gera o PDF, grava no bucket privado e
 * torna o documento imutável. Opcionalmente notifica o paciente com o link.
 */
export class EmitirDocumentoUseCase extends UseCase<EmitirDocumentoInputDto, EmitirDocumentoOutputDto> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: EmitirDocumentoInputDto): Promise<Result<EmitirDocumentoOutputDto>> {
    const documento = await this.dependencies.documentoRepository.findById(input.documentoId);
    if (!documento) return Result.fail(new DocumentoNotFoundError({ documentoId: input.documentoId }));

    if (documento.estaEmitido()) {
      return Result.fail(new DocumentoFinalizadoError({ documentoId: input.documentoId }));
    }

    if (input.papel === 'recepcao' && !TIPOS_DOCUMENTO_RECEPCAO.includes(documento.tipo)) {
      return Result.fail(
        new TipoDocumentoNaoPermitidoError({
          tipo: TIPO_DOCUMENTO_LABELS[documento.tipo],
          motivo: 'a recepção emite apenas declaração de comparecimento',
        }),
      );
    }

    const validacao = documento.validarParaEmissao();
    if (validacao.isFailure) return Result.fail(validacao.error);

    const contexto = await montarContexto(this.dependencies, {
      redeId: documento.redeId,
      unidadeId: documento.unidadeId,
      pacienteId: documento.pacienteId,
      profissionalId: documento.profissionalId,
    });
    if (contexto.isFailure) return Result.fail(contexto.error);

    const numero = documento.numero > 0 ? documento.numero : await this.dependencies.documentoRepository.proximoNumero({ redeId: documento.redeId, tipo: documento.tipo });

    const pdf = await this.dependencies.pdf.gerar({
      documentoId: documento.id.toString(),
      tipo: documento.tipo,
      numero,
      emitidoEm: new Date(),
      cabecalho: contexto.value.cabecalho,
      paciente: contexto.value.paciente,
      profissional: contexto.value.profissional,
      conteudo: documento.conteudo.toJSON(),
    });

    const caminho = documento.montarCaminho();
    await this.dependencies.storage.upload({
      caminho,
      conteudo: pdf.bytes,
      mimeType: pdf.mimeType,
    });

    const emissao = documento.emitir({ storagePath: caminho, por: input.usuarioId });
    if (emissao.isFailure) return Result.fail(emissao.error);

    await this.dependencies.documentoRepository.update(documento);

    let notificacao: EmitirDocumentoOutputDto['notificacao'] = null;

    if (input.notificarPaciente !== false && this.dependencies.notification) {
      const link = await this.dependencies.storage.urlAssinada({ caminho, expiraEmSegundos: 60 * 60 * 24 * 7 });

      const resultado = await this.dependencies.notification.documentoEmitido({
        redeId: documento.redeId,
        redeNome: contexto.value.cabecalho.redeNome,
        documentoId: documento.id.toString(),
        atendimentoId: documento.atendimentoId,
        tipoDocumento: TIPO_DOCUMENTO_LABELS[documento.tipo],
        dataEmissao: new Date().toLocaleDateString('pt-BR'),
        linkDocumento: link,
        profissionalNome: contexto.value.profissional.nome,
        paciente: {
          pacienteId: documento.pacienteId,
          pacienteNome: contexto.value.paciente.nome,
          telefone: contexto.value.paciente.telefone,
          email: contexto.value.paciente.email,
        },
        createdBy: input.usuarioId,
      });

      notificacao = {
        enfileiradas: resultado.enfileiradas.length,
        canal: resultado.canalEscolhido,
        motivo: resultado.motivo,
      };
    }

    const urlAssinada = await this.dependencies.storage.urlAssinada({ caminho });

    return Result.ok({
      documento: this.dependencies.mapper.map({ documento, urlAssinada }),
      notificacao,
    });
  }
}

export class CancelarDocumentoUseCase extends UseCase<
  CancelarDocumentoInputDto,
  CancelarDocumentoOutputDto
> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: CancelarDocumentoInputDto): Promise<Result<CancelarDocumentoOutputDto>> {
    const documento = await this.dependencies.documentoRepository.findById(input.documentoId);
    if (!documento) return Result.fail(new DocumentoNotFoundError({ documentoId: input.documentoId }));

    const cancelamento = documento.cancelar({ motivo: input.motivo });
    if (cancelamento.isFailure) return Result.fail(cancelamento.error);

    await this.dependencies.documentoRepository.update(documento);

    return Result.ok(this.dependencies.mapper.map({ documento }));
  }
}

export class ListarDocumentosUseCase extends UseCase<
  ListarDocumentosInputDto,
  ListarDocumentosOutputDto
> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: ListarDocumentosInputDto): Promise<Result<ListarDocumentosOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const { items, total } = await this.dependencies.documentoRepository.listar({
      redeId: input.redeId,
      pacienteId: input.pacienteId ?? null,
      atendimentoId: input.atendimentoId ?? null,
      profissionalId: input.profissionalId ?? null,
      unidadeId: input.unidadeId ?? null,
      tipo: input.tipo ?? null,
      status: input.status ?? null,
      de: input.de ?? null,
      ate: input.ate ?? null,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    const enriquecimento = await this.enriquecer(items);

    const documentos = await Promise.all(
      items.map(async (documento) => {
        const url = documento.storagePath
          ? await this.dependencies.storage.urlAssinada({ caminho: documento.storagePath })
          : null;

        return this.dependencies.mapper.map({
          documento,
          enriquecimento: enriquecimento.get(documento.id.toString()),
          urlAssinada: url,
        });
      }),
    );

    return Result.ok({ items: documentos, total });
  }

  private async enriquecer(documentos: Documento[]): Promise<Map<string, EnriquecimentoDocumento>> {
    const pacientes = await this.dependencies.pacienteLookup.listarPorIds([
      ...new Set(documentos.map((documento) => documento.pacienteId)),
    ]);
    const unidades = await this.dependencies.unidadeLookup.listarAtivas(
      documentos[0]?.redeId ?? '',
      [...new Set(documentos.map((documento) => documento.unidadeId))],
    );

    const pacientesPorId = new Map(pacientes.map((paciente) => [paciente.id, paciente.nome]));
    const unidadesPorId = new Map(unidades.map((unidade) => [unidade.id, unidade.nome]));

    return new Map(
      documentos.map((documento) => [
        documento.id.toString(),
        {
          pacienteNome: pacientesPorId.get(documento.pacienteId) ?? null,
          unidadeNome: unidadesPorId.get(documento.unidadeId) ?? null,
          profissionalNome: null,
        },
      ]),
    );
  }
}

export class ObterDocumentoUseCase extends UseCase<ObterDocumentoInputDto, ObterDocumentoOutputDto> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: ObterDocumentoInputDto): Promise<Result<ObterDocumentoOutputDto>> {
    const documento = await this.dependencies.documentoRepository.findById(input.documentoId);
    if (!documento) return Result.fail(new DocumentoNotFoundError({ documentoId: input.documentoId }));

    const paciente = await this.dependencies.pacienteLookup.findById(documento.pacienteId);
    const profissional = await this.dependencies.profissionalReader.findById(documento.profissionalId);
    const unidade = await this.dependencies.unidadeLookup.findById(documento.unidadeId);
    const url = documento.storagePath
      ? await this.dependencies.storage.urlAssinada({ caminho: documento.storagePath })
      : null;

    return Result.ok(
      this.dependencies.mapper.map({
        documento,
        urlAssinada: url,
        enriquecimento: {
          pacienteNome: paciente?.nome ?? null,
          profissionalNome: profissional?.nome ?? null,
          unidadeNome: unidade?.nome ?? null,
        },
      }),
    );
  }
}

export class ObterLinkDocumentoUseCase extends UseCase<
  ObterLinkDocumentoInputDto,
  ObterLinkDocumentoOutputDto
> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: ObterLinkDocumentoInputDto): Promise<Result<ObterLinkDocumentoOutputDto>> {
    const documento = await this.dependencies.documentoRepository.findById(input.documentoId);
    if (!documento) return Result.fail(new DocumentoNotFoundError({ documentoId: input.documentoId }));

    if (!documento.storagePath) {
      return Result.ok({ documentoId: input.documentoId, url: null, expiraEm: null });
    }

    const expiraEmSegundos = input.expiraEmSegundos ?? 900;
    const url = await this.dependencies.storage.urlAssinada({
      caminho: documento.storagePath,
      expiraEmSegundos,
    });

    return Result.ok({
      documentoId: input.documentoId,
      url,
      expiraEm: new Date(Date.now() + expiraEmSegundos * 1000).toISOString(),
    });
  }
}

/** Dados para a pré-visualização antes de emitir (§3.6). */
export class PrevisualizarDocumentoUseCase extends UseCase<
  CriarDocumentoInputDto,
  PrevisualizarDocumentoOutputDto
> {
  private readonly dependencies: DocumentoUseCaseDependencies;

  constructor(dependencies: DocumentoUseCaseDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async execute(input: CriarDocumentoInputDto): Promise<Result<PrevisualizarDocumentoOutputDto>> {
    const contexto = await montarContexto(this.dependencies, input);
    if (contexto.isFailure) return Result.fail(contexto.error);

    const proximoNumero = await this.dependencies.documentoRepository.proximoNumero({
      redeId: input.redeId,
      tipo: input.tipo,
    });

    return Result.ok({
      tipo: input.tipo,
      conteudo: input.conteudo ?? {},
      cabecalho: contexto.value.cabecalho,
      paciente: {
        nome: contexto.value.paciente.nome,
        cpfFormatado: contexto.value.paciente.cpfFormatado,
        dataNascimento: contexto.value.paciente.dataNascimento,
        idade: contexto.value.paciente.idade,
      },
      profissional: {
        nome: contexto.value.profissional.nome,
        especialidade: contexto.value.profissional.especialidade,
        conselho: contexto.value.profissional.numeroConselho,
      },
      proximoNumero,
    });
  }
}

export type { DocumentoDto };
