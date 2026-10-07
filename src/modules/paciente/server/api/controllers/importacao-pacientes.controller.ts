import { Controller } from '@/server/api/controller.base';
import { HttpResponse } from '@/server/api/http-response';
import { mapDomainErrorToHttp } from '@/server/api/error-mapper';
import { corpo } from '@/server/api/request-parser';
import { parseCsv } from '@/shared/utils/csv.util';
import type { HttpRequest, HttpResponsePayload } from '@/server/api/http.types';
import type { ImportarPacientesUseCase } from '../../../application/use-cases/importar-pacientes/importar-pacientes.use-case';
import type {
  LinhaImportacaoDto,
  MapeamentoColunasDto,
} from '../../../application/use-cases/importar-pacientes/importar-pacientes.input.dto';

export type ImportacaoPacientesControllerDependencies = {
  importarPacientes: ImportarPacientesUseCase;
};

type LinhasParams = { dados: Record<string, unknown> };

/** POST /api/v1/pacientes/importar — aceita linhas já estruturadas ou CSV bruto. */
export class ImportacaoPacientesController extends Controller<HttpRequest, HttpResponsePayload> {
  private readonly importarPacientes: ImportarPacientesUseCase;

  constructor(dependencies: ImportacaoPacientesControllerDependencies) {
    super();
    this.importarPacientes = dependencies.importarPacientes;
  }

  async handle(request: HttpRequest): Promise<HttpResponsePayload> {
    if (!request.usuario) return HttpResponse.unauthorized();
    if (request.method !== 'POST') {
      return HttpResponse.badRequest({ message: 'Rota não suportada' });
    }

    const dados = corpo(request.body);
    const linhas = this.extrairLinhas({ dados });
    if (linhas.length === 0) {
      return HttpResponse.badRequest({ message: 'Nenhuma linha encontrada no arquivo enviado' });
    }

    const resultado = await this.importarPacientes.execute({
      redeId: request.usuario.redeId,
      usuarioId: request.usuario.id,
      arquivoNome: String(dados.arquivoNome ?? 'importacao.csv'),
      mapeamento: dados.mapeamento as MapeamentoColunasDto,
      linhas,
      consentimentoLgpd: dados.consentimentoLgpd as boolean | undefined,
    });
    if (resultado.isFailure) return mapDomainErrorToHttp({ error: resultado.error });
    return HttpResponse.created({ data: resultado.value });
  }

  /** O parsing do arquivo é responsabilidade da borda HTTP, não do domínio. */
  private extrairLinhas({ dados }: LinhasParams): LinhaImportacaoDto[] {
    if (Array.isArray(dados.linhas)) return dados.linhas as LinhaImportacaoDto[];
    if (typeof dados.conteudo === 'string') {
      return parseCsv({
        content: dados.conteudo,
        delimiter: typeof dados.delimitador === 'string' ? dados.delimitador : undefined,
      }).rows;
    }
    return [];
  }
}
