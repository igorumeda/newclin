import { DadosEmissaoRepository } from '../../../../domain/repositories/dados-emissao-repository.base';
import type {
  DadosEmissaoDocumento,
  ObterDadosEmissaoParams,
} from '../../../../domain/repositories/dados-emissao-repository.interface';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';

export type DadosEmissaoRepositoryDependencies = { db: DatabaseClient };

type DadosEmissaoRow = {
  rede_nome: string;
  rede_logo_url: string | null;
  unidade_nome: string;
  unidade_endereco: string;
  unidade_telefone: string | null;
  paciente_nome: string;
  paciente_cpf: string;
  paciente_nascimento: Date | string;
  profissional_nome: string;
  profissional_conselho: string;
  profissional_numero: string;
  profissional_uf: string;
  profissional_especialidade: string;
};

export class DadosEmissaoRepositoryImpl extends DadosEmissaoRepository {
  private readonly db: DatabaseClient;

  constructor(dependencies: DadosEmissaoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
  }

  async obter(params: ObterDadosEmissaoParams): Promise<DadosEmissaoDocumento | null> {
    const record = await this.db.queryOne<DadosEmissaoRow>({
      sql: `SELECT r.nome                AS rede_nome,
                   r.logotipo_url        AS rede_logo_url,
                   u.nome                AS unidade_nome,
                   concat_ws(', ',
                     NULLIF(u.endereco->>'logradouro', ''),
                     NULLIF(u.endereco->>'numero', ''),
                     NULLIF(u.endereco->>'bairro', ''),
                     NULLIF(u.endereco->>'cidade', ''),
                     NULLIF(u.endereco->>'uf', '')
                   )                     AS unidade_endereco,
                   u.telefone            AS unidade_telefone,
                   p.nome                AS paciente_nome,
                   p.cpf                 AS paciente_cpf,
                   p.data_nascimento     AS paciente_nascimento,
                   pr.nome               AS profissional_nome,
                   pr.conselho_classe::text AS profissional_conselho,
                   pr.numero_conselho    AS profissional_numero,
                   pr.uf_conselho        AS profissional_uf,
                   pr.especialidade      AS profissional_especialidade
              FROM redes r
              JOIN unidades u      ON u.id = $2 AND u.rede_id = r.id
              JOIN pacientes p     ON p.id = $3 AND p.rede_id = r.id
              JOIN profissionais pr ON pr.id = $4 AND pr.rede_id = r.id
             WHERE r.id = $1`,
      params: [params.redeId, params.unidadeId, params.pacienteId, params.profissionalId],
    });
    if (!record) return null;

    const nascimento =
      record.paciente_nascimento instanceof Date
        ? record.paciente_nascimento.toISOString().slice(0, 10)
        : String(record.paciente_nascimento).slice(0, 10);
    const [ano, mes, dia] = nascimento.split('-');

    return {
      cabecalho: {
        redeNome: record.rede_nome,
        redeLogoUrl: record.rede_logo_url,
        unidadeNome: record.unidade_nome,
        unidadeEndereco: record.unidade_endereco,
        unidadeTelefone: record.unidade_telefone,
      },
      paciente: {
        nome: record.paciente_nome,
        cpf: record.paciente_cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'),
        dataNascimento: `${dia}/${mes}/${ano}`,
      },
      profissional: {
        nome: record.profissional_nome,
        conselho: record.profissional_conselho.toUpperCase(),
        numeroConselho: record.profissional_numero,
        ufConselho: record.profissional_uf,
        especialidade: record.profissional_especialidade,
      },
    };
  }
}
