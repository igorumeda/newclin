/**
 * Configuração central do servidor. Nenhuma outra camada lê `process.env`
 * diretamente: a configuração é injetada (ver anti-pattern #21 e #18).
 */

export type DatabaseDriver = 'postgres' | 'pglite';
export type EmailDriver = 'smtp' | 'log';
export type WhatsAppProvider = 'meta' | 'zapi' | 'log';
export type StorageDriver = 'local' | 's3';

export type DatabaseConfig = {
  driver: DatabaseDriver;
  url: string;
  ssl: boolean;
  poolMax: number;
  pgliteDataDir: string;
};

export type AuthConfig = {
  jwtSecret: string;
  cookieName: string;
  sessionTtlHours: number;
};

export type SmtpConfig = {
  driver: EmailDriver;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
};

export type WhatsAppConfig = {
  provider: WhatsAppProvider;
  webhookVerifyToken: string;
  meta: {
    phoneNumberId: string;
    accessToken: string;
    apiVersion: string;
    templateConfirmacao: string;
    templateLembrete: string;
  };
  zapi: {
    baseUrl: string;
    instanceId: string;
    token: string;
    clientToken: string;
  };
};

export type StorageConfig = {
  driver: StorageDriver;
  localDir: string;
  signingSecret: string;
  signedUrlTtlSeconds: number;
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
    publicBaseUrl: string;
  };
};

export type NotificacoesConfig = {
  workerEnabled: boolean;
  intervalSeconds: number;
  lembreteAntecedenciaHoras: number;
  maxTentativas: number;
  cronSecret: string;
};

export type AppConfig = {
  name: string;
  url: string;
  environment: string;
  isProduction: boolean;
  database: DatabaseConfig;
  auth: AuthConfig;
  smtp: SmtpConfig;
  whatsapp: WhatsAppConfig;
  storage: StorageConfig;
  notificacoes: NotificacoesConfig;
};

type ReadStringParams = { key: string; fallback?: string };
type ReadNumberParams = { key: string; fallback: number };
type ReadBooleanParams = { key: string; fallback: boolean };

function readString({ key, fallback = '' }: ReadStringParams): string {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

function readNumber({ key, fallback }: ReadNumberParams): number {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && process.env[key] !== undefined && process.env[key] !== ''
    ? value
    : fallback;
}

function readBoolean({ key, fallback }: ReadBooleanParams): boolean {
  const value = process.env[key];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'sim', 'on'].includes(value.toLowerCase());
}

function resolveDatabaseDriver(): DatabaseDriver {
  const explicit = readString({ key: 'DATABASE_DRIVER' }).toLowerCase();
  if (explicit === 'pglite' || explicit === 'postgres') return explicit;
  return readString({ key: 'DATABASE_URL' }) ? 'postgres' : 'pglite';
}

let cachedConfig: AppConfig | null = null;

export function loadAppConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const environment = readString({ key: 'NODE_ENV', fallback: 'development' });

  cachedConfig = {
    name: readString({ key: 'APP_NAME', fallback: 'NewClin' }),
    url: readString({ key: 'APP_URL', fallback: 'http://localhost:3000' }),
    environment,
    isProduction: environment === 'production',
    database: {
      driver: resolveDatabaseDriver(),
      url: readString({ key: 'DATABASE_URL' }),
      ssl: readBoolean({ key: 'DATABASE_SSL', fallback: false }),
      poolMax: readNumber({ key: 'DATABASE_POOL_MAX', fallback: 10 }),
      pgliteDataDir: readString({ key: 'PGLITE_DATA_DIR', fallback: './.pglite' }),
    },
    auth: {
      jwtSecret: readString({
        key: 'AUTH_JWT_SECRET',
        fallback: 'desenvolvimento-inseguro-troque-no-env-0123456789',
      }),
      cookieName: readString({ key: 'AUTH_COOKIE_NAME', fallback: 'clinica_sessao' }),
      sessionTtlHours: readNumber({ key: 'AUTH_SESSION_TTL_HOURS', fallback: 12 }),
    },
    smtp: {
      driver: (readString({ key: 'EMAIL_DRIVER', fallback: '' }).toLowerCase() ||
        (readString({ key: 'SMTP_HOST' }) ? 'smtp' : 'log')) as EmailDriver,
      host: readString({ key: 'SMTP_HOST' }),
      port: readNumber({ key: 'SMTP_PORT', fallback: 587 }),
      secure: readBoolean({ key: 'SMTP_SECURE', fallback: false }),
      user: readString({ key: 'SMTP_USER' }),
      password: readString({ key: 'SMTP_PASSWORD' }),
      fromName: readString({ key: 'SMTP_FROM_NAME', fallback: 'NewClin' }),
      fromEmail: readString({ key: 'SMTP_FROM_EMAIL', fallback: 'nao-responda@newclin.local' }),
    },
    whatsapp: {
      provider: (readString({ key: 'WHATSAPP_PROVIDER', fallback: 'log' }).toLowerCase() ||
        'log') as WhatsAppProvider,
      webhookVerifyToken: readString({ key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', fallback: 'newclin' }),
      meta: {
        phoneNumberId: readString({ key: 'WHATSAPP_META_PHONE_NUMBER_ID' }),
        accessToken: readString({ key: 'WHATSAPP_META_ACCESS_TOKEN' }),
        apiVersion: readString({ key: 'WHATSAPP_META_API_VERSION', fallback: 'v21.0' }),
        templateConfirmacao: readString({
          key: 'WHATSAPP_META_TEMPLATE_CONFIRMACAO',
          fallback: 'confirmacao_consulta',
        }),
        templateLembrete: readString({
          key: 'WHATSAPP_META_TEMPLATE_LEMBRETE',
          fallback: 'lembrete_consulta',
        }),
      },
      zapi: {
        baseUrl: readString({ key: 'WHATSAPP_ZAPI_BASE_URL', fallback: 'https://api.z-api.io' }),
        instanceId: readString({ key: 'WHATSAPP_ZAPI_INSTANCE_ID' }),
        token: readString({ key: 'WHATSAPP_ZAPI_TOKEN' }),
        clientToken: readString({ key: 'WHATSAPP_ZAPI_CLIENT_TOKEN' }),
      },
    },
    storage: {
      driver: (readString({ key: 'STORAGE_DRIVER', fallback: 'local' }).toLowerCase() ||
        'local') as StorageDriver,
      localDir: readString({ key: 'STORAGE_LOCAL_DIR', fallback: './storage' }),
      signingSecret: readString({
        key: 'STORAGE_SIGNING_SECRET',
        fallback: 'desenvolvimento-inseguro-storage',
      }),
      signedUrlTtlSeconds: readNumber({ key: 'STORAGE_SIGNED_URL_TTL_SECONDS', fallback: 900 }),
      s3: {
        endpoint: readString({ key: 'S3_ENDPOINT' }),
        region: readString({ key: 'S3_REGION', fallback: 'us-east-1' }),
        bucket: readString({ key: 'S3_BUCKET' }),
        accessKeyId: readString({ key: 'S3_ACCESS_KEY_ID' }),
        secretAccessKey: readString({ key: 'S3_SECRET_ACCESS_KEY' }),
        forcePathStyle: readBoolean({ key: 'S3_FORCE_PATH_STYLE', fallback: true }),
        publicBaseUrl: readString({ key: 'S3_PUBLIC_BASE_URL' }),
      },
    },
    notificacoes: {
      workerEnabled: readBoolean({ key: 'NOTIFICACOES_WORKER_ENABLED', fallback: true }),
      intervalSeconds: readNumber({ key: 'NOTIFICACOES_WORKER_INTERVALO_SEGUNDOS', fallback: 30 }),
      lembreteAntecedenciaHoras: readNumber({
        key: 'NOTIFICACOES_LEMBRETE_ANTECEDENCIA_HORAS',
        fallback: 24,
      }),
      maxTentativas: readNumber({ key: 'NOTIFICACOES_MAX_TENTATIVAS', fallback: 3 }),
      cronSecret: readString({ key: 'CRON_SECRET', fallback: '' }),
    },
  };

  return cachedConfig;
}

export type IntegrationStatus = {
  nome: string;
  chave: string;
  configurado: boolean;
  detalhe: string;
};

/** Diagnóstico exibido na tela de configurações (sem expor segredos). */
export function describeIntegrations(): IntegrationStatus[] {
  const config = loadAppConfig();
  return [
    {
      nome: 'Banco de dados',
      chave: 'DATABASE_URL',
      configurado: config.database.driver === 'postgres' && Boolean(config.database.url),
      detalhe:
        config.database.driver === 'postgres'
          ? 'PostgreSQL via DATABASE_URL'
          : 'PGlite local (modo desenvolvimento)',
    },
    {
      nome: 'E-mail (SMTP)',
      chave: 'SMTP_HOST',
      configurado: config.smtp.driver === 'smtp' && Boolean(config.smtp.host),
      detalhe:
        config.smtp.driver === 'smtp'
          ? `${config.smtp.host}:${config.smtp.port}`
          : 'Driver de log — mensagens apenas registradas',
    },
    {
      nome: 'WhatsApp',
      chave: 'WHATSAPP_PROVIDER',
      configurado:
        (config.whatsapp.provider === 'meta' && Boolean(config.whatsapp.meta.accessToken)) ||
        (config.whatsapp.provider === 'zapi' && Boolean(config.whatsapp.zapi.token)),
      detalhe:
        config.whatsapp.provider === 'log'
          ? 'Driver de log — mensagens apenas registradas'
          : `Provedor ${config.whatsapp.provider}`,
    },
    {
      nome: 'Storage de arquivos',
      chave: 'STORAGE_DRIVER',
      configurado: config.storage.driver === 's3' ? Boolean(config.storage.s3.bucket) : true,
      detalhe:
        config.storage.driver === 's3'
          ? `Bucket ${config.storage.s3.bucket || 'não definido'}`
          : `Sistema de arquivos (${config.storage.localDir})`,
    },
  ];
}
