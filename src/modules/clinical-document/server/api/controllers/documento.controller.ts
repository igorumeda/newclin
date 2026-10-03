import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { buildPaginationMeta } from '@core/application/pagination/pagination';
import type { RequestContext } from '@/server/api/request-context.types';
import type { IUseCase } from '@core/application/use-case.interface';
import type {
  AtualizarDocumentoInputDto,
  AtualizarDocumentoOutputDto,
  CancelarDocumentoInputDto,
  CancelarDocumentoOutputDto,
  CriarDocumentoInputDto,
  CriarDocumentoOutputDto,
  EmitirDocumentoInputDto,
  EmitirDocumentoOutputDto,
  ListarDocumentosInputDto,
  ListarDocumentosOutputDto,
  ObterDocumentoInputDto,
  ObterDocumentoOutputDto,
  ObterLinkDocumentoInputDto,
  ObterLinkDocumentoOutputDto,
  PrevisualizarDocumentoOutputDto,
} from '../../../application/dtos/documento.dto';

export type DocumentoControllerDependencies = {
  criarDocumento: IUseCase<CriarDocumentoInputDto, CriarDocumentoOutputDto>;
  atualizarDocumento: IUseCase<AtualizarDocumentoInputDto, AtualizarDocumentoOutputDto>;
  emitirDocumento: IUseCase<EmitirDocumentoInputDto, EmitirDocumentoOutputDto>;
  cancelarDocumento: IUseCase<CancelarDocumentoInputDto, CancelarDocumentoOutputDto>;
  listarDocumentos: IUseCase<ListarDocumentosInputDto, ListarDocumentosOutputDto>;
  obterDocumento: IUseCase<ObterDocumentoInputDto, ObterDocumentoOutputDto>;
  obterLinkDocumento: IUseCase<ObterLinkDocumentoInputDto, ObterLinkDocumentoOutputDto>;
  previsualizarDocumento: IUseCase<CriarDocumentoInputDto, PrevisualizarDocumentoOutputDto>;
};

export type DocumentoControllerRequest =
  | {
      action: 'criar';
      context: RequestContext;
      input: Omit<CriarDocumentoInputDto, 'redeId' | 'createdBy' | 'papel'>;
    }
  | {
      action: 'previsualizar';
      context: RequestContext;
      input: Omit<CriarDocumentoInputDto, 'redeId' | 'createdBy' | 'papel'>;
    }
  | {
      action: 'atualizar';
      context: RequestContext;
      documentoId: string;
      input: Omit<AtualizarDocumentoInputDto, 'documentoId'>;
    }
  | {
      action: 'emitir';
      context: RequestContext;
      documentoId: string;
      input: Omit<EmitirDocumentoInputDto, 'documentoId' | 'usuarioId' | 'papel'>;
    }
  | {
      action: 'cancelar';
      context: RequestContext;
      documentoId: string;
      input: Omit<CancelarDocumentoInputDto, 'documentoId'>;
    }
  | { action: 'listar'; context: RequestContext; input: Omit<ListarDocumentosInputDto, 'redeId'> }
  | { action: 'obter'; context: RequestContext; documentoId: string }
  | {
      action: 'link';
      context: RequestContext;
      documentoId: string;
      input: Omit<ObterLinkDocumentoInputDto, 'documentoId'>;
    };

export class DocumentoController extends Controller<DocumentoControllerRequest, HttpResponse> {
  private readonly dependencies: DocumentoControllerDependencies;

  constructor(dependencies: DocumentoControllerDependencies) {
    super();
    this.dependencies = dependencies;
  }

  async handle(request: DocumentoControllerRequest): Promise<HttpResponse> {
    switch (request.action) {
      case 'criar': {
        const result = await this.dependencies.criarDocumento.execute({
          ...request.input,
          redeId: request.context.redeId,
          createdBy: request.context.userId,
          papel: request.context.role,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.created(result.value);
      }

      case 'previsualizar': {
        const result = await this.dependencies.previsualizarDocumento.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'atualizar': {
        const result = await this.dependencies.atualizarDocumento.execute({
          ...request.input,
          documentoId: request.documentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'emitir': {
        const result = await this.dependencies.emitirDocumento.execute({
          ...request.input,
          documentoId: request.documentoId,
          usuarioId: request.context.userId,
          papel: request.context.role,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'cancelar': {
        const result = await this.dependencies.cancelarDocumento.execute({
          ...request.input,
          documentoId: request.documentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'listar': {
        const result = await this.dependencies.listarDocumentos.execute({
          ...request.input,
          redeId: request.context.redeId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);

        const perPage = request.input.perPage ?? 20;
        const page = request.input.page ?? 1;

        return HttpResponse.ok(
          result.value.items,
          buildPaginationMeta({ pagination: { page, perPage }, total: result.value.total }),
        );
      }

      case 'obter': {
        const result = await this.dependencies.obterDocumento.execute({
          documentoId: request.documentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }

      case 'link': {
        const result = await this.dependencies.obterLinkDocumento.execute({
          ...request.input,
          documentoId: request.documentoId,
        });
        if (result.isFailure) return HttpResponse.fromDomainError(result.error);
        return HttpResponse.ok(result.value);
      }
    }
  }
}
