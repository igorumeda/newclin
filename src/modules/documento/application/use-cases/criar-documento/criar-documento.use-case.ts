import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Documento } from '../../../domain/entities/documento.entity';
import type { IDocumentoRepository } from '../../../domain/repositories/documento-repository.interface';
import { DocumentoMapper } from '../../mappers/documento.mapper';
import type { DocumentoOutputDto } from '../../mappers/documento.output.dto';
import type { CriarDocumentoInputDto } from './criar-documento.input.dto';

export type CriarDocumentoDependencies = {
  documentoRepository: IDocumentoRepository;
  mapper: DocumentoMapper;
};

export class CriarDocumentoUseCase extends UseCase<CriarDocumentoInputDto, DocumentoOutputDto> {
  private readonly documentoRepository: IDocumentoRepository;
  private readonly mapper: DocumentoMapper;

  constructor(dependencies: CriarDocumentoDependencies) {
    super();
    this.documentoRepository = dependencies.documentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarDocumentoInputDto): Promise<Result<DocumentoOutputDto>> {
    const documentoResult = Documento.create({
      redeId: input.redeId,
      unidadeId: input.unidadeId,
      pacienteId: input.pacienteId,
      atendimentoId: input.atendimentoId,
      profissionalId: input.profissionalId,
      tipo: input.tipo,
      conteudo: input.conteudo,
    });
    if (documentoResult.isFailure) return Result.propagate(documentoResult);

    await this.documentoRepository.salvar(documentoResult.value);
    return Result.ok(this.mapper.map({ documento: documentoResult.value }));
  }
}
