import { ImportacaoPacientesRepository } from '../../../../domain/repositories/importacao-repository.base';
import type {
  ImportacaoResumo,
  ListarImportacoesParams,
  RegistrarImportacaoParams,
} from '../../../../domain/repositories/importacao-repository.interface';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';

export type ImportacaoPacientesRepositoryDependencies = { db: DatabaseClient };

type ImportacaoModel = {
  id: string;
  arquivo_nome: string;
  total_linhas: number;
  total_importados: number;
  total_ignorados: number;
  total_erros: number;
  created_at: Date;
};

export class ImportacaoPacientesRepositoryImpl extends ImportacaoPacientesRepository {
  private readonly db: DatabaseClient;

  constructor(dependencies: ImportacaoPacientesRepositoryDependencies) {
    super();
    this.db = dependencies.db;
  }

  async registrar({ redeId, usuarioId, relatorio }: RegistrarImportacaoParams): Promise<void> {
    await this.db.query({
      sql: `INSERT INTO importacoes_pacientes
              (rede_id, usuario_id, arquivo_nome, total_linhas, total_importados,
               total_ignorados, total_erros, detalhes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      params: [
        redeId,
        usuarioId,
        relatorio.arquivoNome,
        relatorio.total,
        relatorio.importados,
        relatorio.ignorados,
        relatorio.erros,
        JSON.stringify(relatorio.detalhes),
      ],
    });
  }

  async listar({ redeId, limite }: ListarImportacoesParams): Promise<ImportacaoResumo[]> {
    const records = await this.db.query<ImportacaoModel>({
      sql: `SELECT id, arquivo_nome, total_linhas, total_importados, total_ignorados,
                   total_erros, created_at
              FROM importacoes_pacientes
             WHERE rede_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
      params: [redeId, limite ?? 20],
    });
    return records.map((record) => ({
      id: record.id,
      arquivoNome: record.arquivo_nome,
      total: record.total_linhas,
      importados: record.total_importados,
      ignorados: record.total_ignorados,
      erros: record.total_erros,
      criadoEm: new Date(record.created_at).toISOString(),
    }));
  }
}
