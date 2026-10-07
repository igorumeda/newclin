import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { DadosEmissaoIndisponiveisError } from '../../../domain/errors/dados-emissao-indisponiveis.error';
import { DocumentoNaoEncontradoError } from '../../../domain/errors/documento-nao-encontrado.error';
import type { IDadosEmissaoRepository } from '../../../domain/repositories/dados-emissao-repository.interface';
import type { IDocumentoRepository } from '../../../domain/repositories/documento-repository.interface';
import type { IArmazenamentoProvider } from '../../../domain/services/armazenamento-provider.interface';
import type { IGeradorPdfProvider } from '../../../domain/services/gerador-pdf-provider.interface';
import { DocumentoMapper } from '../../mappers/documento.mapper';
import type { DocumentoOutputDto } from '../../mappers/documento.output.dto';
import type { EmitirDocumentoInputDto } from './emitir-documento.input.dto';

export type EmitirDocumentoDependencies = {
  documentoRepository: IDocumentoRepository;
  dadosEmissaoRepository: IDadosEmissaoRepository;
  geradorPdf: IGeradorPdfProvider;
  armazenamento: IArmazenamentoProvider;
  mapper: DocumentoMapper;
};

export class EmitirDocumentoUseCase extends UseCase<EmitirDocumentoInputDto, DocumentoOutputDto> {
  private readonly documentoRepository: IDocumentoRepository;
  private readonly dadosEmissaoRepository: IDadosEmissaoRepository;
  private readonly geradorPdf: IGeradorPdfProvider;
  private readonly armazenamento: IArmazenamentoProvider;
  private readonly mapper: DocumentoMapper;

  constructor(dependencies: EmitirDocumentoDependencies) {
    super();
    this.documentoRepository = dependencies.documentoRepository;
    this.dadosEmissaoRepository = dependencies.dadosEmissaoRepository;
    this.geradorPdf = dependencies.geradorPdf;
    this.armazenamento = dependencies.armazenamento;
    this.mapper = dependencies.mapper;
  }

  async execute(input: EmitirDocumentoInputDto): Promise<Result<DocumentoOutputDto>> {
    const documento = await this.documentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!documento) return Result.fail(new DocumentoNaoEncontradoError({ documentoId: input.id }));

    if (input.conteudo) {
      const atualizacao = documento.atualizarConteudo({ conteudo: input.conteudo });
      if (atualizacao.isFailure) return Result.propagate(atualizacao);
    }

    const dados = await this.dadosEmissaoRepository.obter({
      redeId: documento.redeId,
      unidadeId: documento.unidadeId,
      pacienteId: documento.pacienteId,
      profissionalId: documento.profissionalId,
    });
    if (!dados) {
      return Result.fail(new DadosEmissaoIndisponiveisError({ documentoId: input.id }));
    }

    const emitidoEm = new Date();
    const codigoVerificacao = documento.id.toString().replace(/-/g, '').slice(0, 12).toUpperCase();

    const pdf = await this.geradorPdf.gerar({
      tipo: documento.tipo.value,
      titulo: documento.tipo.rotulo,
      cabecalho: dados.cabecalho,
      paciente: dados.paciente,
      profissional: dados.profissional,
      conteudo: documento.conteudo,
      emitidoEm,
      codigoVerificacao,
    });

    const chave = `documentos/${documento.redeId}/${documento.id.toString()}.pdf`;
    const arquivo = await this.armazenamento.armazenar({
      chave,
      conteudo: pdf.conteudo,
      mimeType: pdf.mimeType,
    });

    const emissao = documento.emitir({
      storageKey: arquivo.chave,
      pdfUrl: arquivo.url,
      emitidoPor: input.emitidoPor ?? null,
    });
    if (emissao.isFailure) return Result.propagate(emissao);

    await this.documentoRepository.atualizar(documento);

    const dto = this.mapper.map({ documento });
    dto.pdfUrl = await this.armazenamento.urlAssinada({ chave: arquivo.chave });
    return Result.ok(dto);
  }
}
