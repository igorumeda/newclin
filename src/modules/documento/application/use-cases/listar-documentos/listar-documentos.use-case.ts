import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IDocumentoRepository } from '../../../domain/repositories/documento-repository.interface';
import { DocumentoMapper } from '../../mappers/documento.mapper';
import type { DocumentoOutputDto } from '../../mappers/documento.output.dto';
import type { ListarDocumentosInputDto } from './listar-documentos.input.dto';

export type ListarDocumentosDependencies = {
  documentoRepository: IDocumentoRepository;
  mapper: DocumentoMapper;
};

export class ListarDocumentosUseCase extends UseCase<
  ListarDocumentosInputDto,
  DocumentoOutputDto[]
> {
  private readonly documentoRepository: IDocumentoRepository;
  private readonly mapper: DocumentoMapper;

  constructor(dependencies: ListarDocumentosDependencies) {
    super();
    this.documentoRepository = dependencies.documentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarDocumentosInputDto): Promise<Result<DocumentoOutputDto[]>> {
    const documentos = await this.documentoRepository.listar({
      redeId: input.redeId,
      pacienteId: input.pacienteId ?? null,
      atendimentoId: input.atendimentoId ?? null,
      tipo: input.tipo ?? null,
      limite: input.limite,
    });
    return Result.ok(documentos.map((documento) => this.mapper.map({ documento })));
  }
}
