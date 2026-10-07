import type {
  AgendamentoPorTelefone,
  AtualizarStatusPorWebhookParams,
  BuscarAgendamentoPorTelefoneParams,
  IMensagemWhatsAppRepository,
  ListarMensagensParams,
  MensagemWhatsAppRegistro,
  RegistrarMensagemParams,
} from './mensagem-whatsapp-repository.interface';

export abstract class MensagemWhatsAppRepository implements IMensagemWhatsAppRepository {
  abstract registrar(params: RegistrarMensagemParams): Promise<void>;
  abstract listar(params: ListarMensagensParams): Promise<MensagemWhatsAppRegistro[]>;
  abstract buscarProximoAgendamentoPorTelefone(
    params: BuscarAgendamentoPorTelefoneParams,
  ): Promise<AgendamentoPorTelefone | null>;
  abstract atualizarStatusAgendamento(params: AtualizarStatusPorWebhookParams): Promise<void>;
}
