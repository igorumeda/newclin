import { AtendimentoRepository } from '../../../../domain/repositories/atendimento-repository.base';
import type {
  BuscarAtendimentoParams,
  BuscarPorAgendamentoParams,
  ContarAtendimentosParams,
  ListarAdendosParams,
  ListarAtendimentosParams,
} from '../../../../domain/repositories/atendimento-repository.interface';
import type { Adendo } from '../../../../domain/entities/adendo.entity';
import type { Atendimento } from '../../../../domain/entities/atendimento.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { AdendoPersistenceMapper } from '../mappers/adendo-persistence.mapper';
import { AtendimentoPersistenceMapper } from '../mappers/atendimento-persistence.mapper';
import type { AdendoModel, AtendimentoModel } from '../models/atendimento.model';

export type AtendimentoRepositoryDependencies = {
  db: DatabaseClient;
  mapper: AtendimentoPersistenceMapper;
  adendoMapper: AdendoPersistenceMapper;
};

const FILTROS = `
  AND ($2::uuid IS NULL OR paciente_id = $2::uuid)
  AND ($3::uuid IS NULL OR profissional_id = $3::uuid)
  AND ($4::uuid IS NULL OR unidade_id = $4::uuid)
`;

export class AtendimentoRepositoryImpl extends AtendimentoRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: AtendimentoPersistenceMapper;
  private readonly adendoMapper: AdendoPersistenceMapper;

  constructor(dependencies: AtendimentoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
    this.adendoMapper = dependencies.adendoMapper;
  }

  async buscarPorId({ redeId, id }: BuscarAtendimentoParams): Promise<Atendimento | null> {
    const record = await this.db.queryOne<AtendimentoModel>({
      sql: 'SELECT * FROM atendimentos WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async buscarPorAgendamento({
    redeId,
    agendamentoId,
  }: BuscarPorAgendamentoParams): Promise<Atendimento | null> {
    const record = await this.db.queryOne<AtendimentoModel>({
      sql: `SELECT * FROM atendimentos
             WHERE rede_id = $1 AND agendamento_id = $2 AND deleted_at IS NULL`,
      params: [redeId, agendamentoId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar(params: ListarAtendimentosParams): Promise<Atendimento[]> {
    const records = await this.db.query<AtendimentoModel>({
      sql: `SELECT * FROM atendimentos
             WHERE rede_id = $1 AND deleted_at IS NULL ${FILTROS}
             ORDER BY iniciado_em DESC
             LIMIT $5 OFFSET $6`,
      params: [
        params.redeId,
        params.pacienteId ?? null,
        params.profissionalId ?? null,
        params.unidadeId ?? null,
        params.limite,
        params.offset,
      ],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async contar(params: ContarAtendimentosParams): Promise<number> {
    const record = await this.db.queryOne<{ total: number }>({
      sql: `SELECT count(*)::int AS total FROM atendimentos
             WHERE rede_id = $1 AND deleted_at IS NULL ${FILTROS}`,
      params: [
        params.redeId,
        params.pacienteId ?? null,
        params.profissionalId ?? null,
        params.unidadeId ?? null,
      ],
    });
    return record?.total ?? 0;
  }

  async listarAdendos({ redeId, atendimentoId }: ListarAdendosParams): Promise<Adendo[]> {
    const records = await this.db.query<AdendoModel>({
      sql: `SELECT * FROM adendos
             WHERE rede_id = $1 AND atendimento_id = $2
             ORDER BY created_at ASC`,
      params: [redeId, atendimentoId],
    });
    return records.map((record) => this.adendoMapper.map({ record }));
  }

  async salvar(atendimento: Atendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: atendimento });
    await this.db.query({
      sql: `INSERT INTO atendimentos
              (id, rede_id, unidade_id, agendamento_id, paciente_id, profissional_id,
               template_id, template_versao, dados_preenchidos, queixa_principal, anamnese,
               exame_fisico, hipotese_diagnostica, cid10, conduta, fonte_pagadora, status,
               iniciado_em, finalizado_em)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,
                    $16::fonte_pagadora,$17::atendimento_status,$18,$19)`,
      params: [
        data.id,
        data.rede_id,
        data.unidade_id,
        data.agendamento_id,
        data.paciente_id,
        data.profissional_id,
        data.template_id,
        data.template_versao,
        data.dados_preenchidos,
        data.queixa_principal,
        data.anamnese,
        data.exame_fisico,
        data.hipotese_diagnostica,
        data.cid10,
        data.conduta,
        data.fonte_pagadora,
        data.status,
        data.iniciado_em,
        data.finalizado_em,
      ],
    });
  }

  async atualizar(atendimento: Atendimento): Promise<void> {
    const data = this.mapper.toPersistence({ entity: atendimento });
    await this.db.query({
      sql: `UPDATE atendimentos
               SET template_id = $3, template_versao = $4, dados_preenchidos = $5::jsonb,
                   queixa_principal = $6, anamnese = $7, exame_fisico = $8,
                   hipotese_diagnostica = $9, cid10 = $10, conduta = $11,
                   fonte_pagadora = $12::fonte_pagadora, status = $13::atendimento_status,
                   finalizado_em = $14, updated_at = now()
             WHERE id = $1 AND rede_id = $2`,
      params: [
        data.id,
        data.rede_id,
        data.template_id,
        data.template_versao,
        data.dados_preenchidos,
        data.queixa_principal,
        data.anamnese,
        data.exame_fisico,
        data.hipotese_diagnostica,
        data.cid10,
        data.conduta,
        data.fonte_pagadora,
        data.status,
        data.finalizado_em,
      ],
    });
  }

  async salvarAdendo(adendo: Adendo): Promise<void> {
    await this.db.query({
      sql: `INSERT INTO adendos
              (id, rede_id, atendimento_id, profissional_id, usuario_id, conteudo)
            VALUES ($1,$2,$3,$4,$5,$6)`,
      params: [
        adendo.id.toString(),
        adendo.redeId,
        adendo.atendimentoId,
        adendo.profissionalId,
        adendo.usuarioId,
        adendo.conteudo,
      ],
    });
  }
}
