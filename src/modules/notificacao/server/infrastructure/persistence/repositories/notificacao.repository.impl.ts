import { NotificacaoRepository } from '../../../../domain/repositories/notificacao-repository.base';
import type {
  BuscarNotificacaoParams,
  ExisteNotificacaoParams,
  ListarNotificacoesParams,
  ListarPendentesParams,
} from '../../../../domain/repositories/notificacao-repository.interface';
import type { Notificacao } from '../../../../domain/entities/notificacao.entity';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';
import { NotificacaoPersistenceMapper } from '../mappers/notificacao-persistence.mapper';
import type { NotificacaoModel } from '../models/notificacao.model';

export type NotificacaoRepositoryDependencies = {
  db: DatabaseClient;
  mapper: NotificacaoPersistenceMapper;
};

export class NotificacaoRepositoryImpl extends NotificacaoRepository {
  private readonly db: DatabaseClient;
  private readonly mapper: NotificacaoPersistenceMapper;

  constructor(dependencies: NotificacaoRepositoryDependencies) {
    super();
    this.db = dependencies.db;
    this.mapper = dependencies.mapper;
  }

  async buscarPorId({ redeId, id }: BuscarNotificacaoParams): Promise<Notificacao | null> {
    const record = await this.db.queryOne<NotificacaoModel>({
      sql: 'SELECT * FROM notificacoes WHERE id = $1 AND rede_id = $2',
      params: [id, redeId],
    });
    return record ? this.mapper.toDomain({ record }) : null;
  }

  async listar(params: ListarNotificacoesParams): Promise<Notificacao[]> {
    const records = await this.db.query<NotificacaoModel>({
      sql: `SELECT * FROM notificacoes
             WHERE rede_id = $1
               AND ($2::notificacao_canal IS NULL OR canal = $2::notificacao_canal)
               AND ($3::notificacao_status IS NULL OR status = $3::notificacao_status)
             ORDER BY created_at DESC
             LIMIT $4`,
      params: [params.redeId, params.canal ?? null, params.status ?? null, params.limite ?? 100],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  /** O worker roda fora do contexto de rede: a fila é global por definição. */
  async listarPendentes({ limite, referencia }: ListarPendentesParams): Promise<Notificacao[]> {
    const records = await this.db.query<NotificacaoModel>({
      sql: `SELECT * FROM notificacoes
             WHERE status IN ('pendente', 'processando')
               AND agendada_para <= $1
             ORDER BY agendada_para ASC
             LIMIT $2`,
      params: [referencia, limite],
    });
    return records.map((record) => this.mapper.toDomain({ record }));
  }

  async existe({ agendamentoId, canal, tipo }: ExisteNotificacaoParams): Promise<boolean> {
    const record = await this.db.queryOne<{ total: number }>({
      sql: `SELECT count(*)::int AS total FROM notificacoes
             WHERE agendamento_id = $1
               AND canal = $2::notificacao_canal
               AND tipo = $3::notificacao_tipo
               AND status <> 'falha'`,
      params: [agendamentoId, canal, tipo],
    });
    return (record?.total ?? 0) > 0;
  }

  async salvar(notificacao: Notificacao): Promise<void> {
    const data = this.mapper.toPersistence({ entity: notificacao });
    await this.db.query({
      sql: `INSERT INTO notificacoes
              (id, rede_id, canal, tipo, destinatario, assunto, conteudo, variaveis, status,
               tentativas, erro, agendada_para, enviada_em, agendamento_id, paciente_id,
               documento_id, provider, provider_message_id, fallback_de)
            VALUES ($1,$2,$3::notificacao_canal,$4::notificacao_tipo,$5,$6,$7,$8::jsonb,
                    $9::notificacao_status,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      params: [
        data.id,
        data.rede_id,
        data.canal,
        data.tipo,
        data.destinatario,
        data.assunto,
        data.conteudo,
        data.variaveis,
        data.status,
        data.tentativas,
        data.erro,
        data.agendada_para,
        data.enviada_em,
        data.agendamento_id,
        data.paciente_id,
        data.documento_id,
        data.provider,
        data.provider_message_id,
        data.fallback_de,
      ],
    });
  }

  async atualizar(notificacao: Notificacao): Promise<void> {
    const data = this.mapper.toPersistence({ entity: notificacao });
    await this.db.query({
      sql: `UPDATE notificacoes
               SET status = $2::notificacao_status, tentativas = $3, erro = $4,
                   agendada_para = $5, enviada_em = $6, provider = $7,
                   provider_message_id = $8, updated_at = now()
             WHERE id = $1`,
      params: [
        data.id,
        data.status,
        data.tentativas,
        data.erro,
        data.agendada_para,
        data.enviada_em,
        data.provider,
        data.provider_message_id,
      ],
    });
  }
}
