import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { DocumentoNaoEncontradoError } from '../../../domain/errors/documento-nao-encontrado.error';
import type { IDocumentoRepository } from '../../../domain/repositories/documento-repository.interface';
import type { IArmazenamentoProvider } from '../../../domain/services/armazenamento-provider.interface';
import { DocumentoMapper } from '../../mappers/documento.mapper';
import type { DocumentoOutputDto } from '../../mappers/documento.output.dto';
import type { ObterDocumentoInputDto } from './obter-documento.input.dto';

export type ObterDocumentoDependencies = {
  documentoRepository: IDocumentoRepository;
  armazenamento: IArmazenamentoProvider;
  mapper: DocumentoMapper;
};

export class ObterDocumentoUseCase extends UseCase<ObterDocumentoInputDto, DocumentoOutputDto> {
  private readonly documentoRepository: IDocumentoRepository;
  private readonly armazenamento: IArmazenamentoProvider;
  private readonly mapper: DocumentoMapper;

  constructor(dependencies: ObterDocumentoDependencies) {
    super();
    this.documentoRepository = dependencies.documentoRepository;
    this.armazenamento = dependencies.armazenamento;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ObterDocumentoInputDto): Promise<Result<DocumentoOutputDto>> {
    const documento = await this.documentoRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!documento) return Result.fail(new DocumentoNaoEncontradoError({ documentoId: input.id }));

    const dto = this.mapper.map({ documento });
    if (documento.storageKey) {
      dto.pdfUrl = await this.armazenamento.urlAssinada({ chave: documento.storageKey });
    }
    return Result.ok(dto);
  }
}
