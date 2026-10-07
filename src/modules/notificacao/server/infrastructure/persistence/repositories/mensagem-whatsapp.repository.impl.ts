import { MensagemWhatsAppRepository } from '../../../../domain/repositories/mensagem-whatsapp-repository.base';
import type {
  AgendamentoPorTelefone,
  AtualizarStatusPorWebhookParams,
  BuscarAgendamentoPorTelefoneParams,
  ListarMensagensParams,
  MensagemWhatsAppRegistro,
  RegistrarMensagemParams,
} from '../../../../domain/repositories/mensagem-whatsapp-repository.interface';
import type { DirecaoMensagem } from '../../../../domain/repositories/mensagem-whatsapp-repository.interface';
import type { DatabaseClient } from '@/server/infrastructure/database/database-client.base';

export type MensagemWhatsAppRepositoryDependencies = { db: DatabaseClient };

type MensagemRow = {
  id: string;
  direcao: string;
  telefone: string;
  conteudo: string;
  provider: string;
  created_at: Date;
};
type AgendamentoRow = {
  rede_id: string;
  id: string;
  paciente_id: string;
  status: string;
};

/** Mantém apenas os dígitos do telefone para casar com o formato dos provedores. */
function somenteDigitos(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

export class MensagemWhatsAppRepositoryImpl extends MensagemWhatsAppRepository {
  private readonly db: DatabaseClient;

  constructor(dependencies: MensagemWhatsAppRepositoryDependencies) {
    super();
    this.db = dependencies.db;
  }

  async registrar(params: RegistrarMensagemParams): Promise<void> {
    if (!params.redeId) return;
    await this.db.query({
      sql: `INSERT INTO mensagens_whatsapp
              (rede_id, direcao, telefone, conteudo, provider, provider_message_id,
               agendamento_id, paciente_id, payload)
            VALUES ($1,$2::mensagem_direcao,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      params: [
        params.redeId,
        params.direcao,
        somenteDigitos(params.telefone),
        params.conteudo,
        params.provider,
        params.providerMessageId,
        params.agendamentoId ?? null,
        params.pacienteId ?? null,
        JSON.stringify(params.payload ?? {}),
      ],
    });
  }

  async listar({
    redeId,
    telefone,
    limite,
  }: ListarMensagensParams): Promise<MensagemWhatsAppRegistro[]> {
    const records = await this.db.query<MensagemRow>({
      sql: `SELECT id, direcao::text AS direcao, telefone, conteudo, provider, created_at
              FROM mensagens_whatsapp
             WHERE rede_id = $1
               AND ($2::text IS NULL OR telefone = $2)
             ORDER BY created_at DESC
             LIMIT $3`,
      params: [redeId, telefone ? somenteDigitos(telefone) : null, limite ?? 100],
    });
    return records.map((record) => ({
      id: record.id,
      direcao: record.direcao as DirecaoMensagem,
      telefone: record.telefone,
      conteudo: record.conteudo,
      provider: record.provider,
      criadoEm: new Date(record.created_at).toISOString(),
    }));
  }

  async buscarProximoAgendamentoPorTelefone({
    telefone,
  }: BuscarAgendamentoPorTelefoneParams): Promise<AgendamentoPorTelefone | null> {
    const digitos = somenteDigitos(telefone);
    const record = await this.db.queryOne<AgendamentoRow>({
      sql: `SELECT a.rede_id, a.id, a.paciente_id, a.status::text AS status
              FROM agendamentos a
              JOIN pacientes p ON p.id = a.paciente_id
             WHERE a.deleted_at IS NULL
               AND a.status IN ('agendado', 'confirmado')
               AND a.data_hora_inicio > now() - INTERVAL '2 hours'
               AND right(regexp_replace(p.telefone, '\\D', '', 'g'), 8) = right($1, 8)
             ORDER BY a.data_hora_inicio ASC
             LIMIT 1`,
      params: [digitos],
    });
    if (!record) return null;
    return {
      redeId: record.rede_id,
      agendamentoId: record.id,
      pacienteId: record.paciente_id,
      status: record.status,
    };
  }

  async atualizarStatusAgendamento(params: AtualizarStatusPorWebhookParams): Promise<void> {
    await this.db.query({
      sql: `UPDATE agendamentos
               SET status = $3::agendamento_status,
                   motivo_cancelamento = COALESCE($4, motivo_cancelamento),
                   updated_at = now()
             WHERE id = $1 AND rede_id = $2 AND deleted_at IS NULL`,
      params: [params.agendamentoId, params.redeId, params.status, params.motivo ?? null],
    });
  }
}
