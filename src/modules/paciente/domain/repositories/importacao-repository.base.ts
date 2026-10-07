import type {
  IImportacaoPacientesRepository,
  ImportacaoResumo,
  ListarImportacoesParams,
  RegistrarImportacaoParams,
} from './importacao-repository.interface';

export abstract class ImportacaoPacientesRepository implements IImportacaoPacientesRepository {
  abstract registrar(params: RegistrarImportacaoParams): Promise<void>;
  abstract listar(params: ListarImportacoesParams): Promise<ImportacaoResumo[]>;
}
