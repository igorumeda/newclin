export type EnviarEmailParams = {
  destinatario: string;
  assunto: string;
  corpoTexto: string;
  corpoHtml?: string | null;
};
export type ResultadoEnvioEmail = {
  sucesso: boolean;
  provider: string;
  mensagemId: string | null;
  erro: string | null;
};

export interface IEmailProvider {
  enviar(params: EnviarEmailParams): Promise<ResultadoEnvioEmail>;
}

export const EMAIL_PROVIDER = Symbol('IEmailProvider');
