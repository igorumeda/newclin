import type {
  EnviarEmailParams,
  IEmailProvider,
  ResultadoEnvioEmail,
} from '../../../domain/services/email-provider.interface';

export abstract class EmailProvider implements IEmailProvider {
  abstract enviar(params: EnviarEmailParams): Promise<ResultadoEnvioEmail>;
}
