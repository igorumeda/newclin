import { EmailProvider } from './email-provider.base';
import type {
  EnviarEmailParams,
  ResultadoEnvioEmail,
} from '../../../domain/services/email-provider.interface';

/** Driver padrão de desenvolvimento: apenas registra o e-mail no console. */
export class LogEmailProvider extends EmailProvider {
  async enviar(params: EnviarEmailParams): Promise<ResultadoEnvioEmail> {
    // eslint-disable-next-line no-console
    console.info(
      `[email:log] para=${params.destinatario} assunto="${params.assunto}"\n${params.corpoTexto}`,
    );
    return {
      sucesso: true,
      provider: 'log',
      mensagemId: `log-${Date.now()}`,
      erro: null,
    };
  }
}
