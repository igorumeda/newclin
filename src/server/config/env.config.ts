/**
 * Configuração de ambiente do servidor.
 * A leitura é tolerante: o build e a navegação não quebram quando o `.env`
 * ainda não foi preenchido — a aplicação exibe o aviso de configuração.
 */
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Clínica SaaS'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

  SUPABASE_STORAGE_BUCKET_LOGOS: z.string().default('logos'),
  SUPABASE_STORAGE_BUCKET_ATTACHMENTS: z.string().default('anexos'),
  SUPABASE_STORAGE_BUCKET_DOCUMENTS: z.string().default('documentos'),
  STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_REPLY_TO: z.string().optional(),

  WHATSAPP_PROVIDER: z.enum(['meta', 'zapi', 'twilio', '360dialog', 'noop']).default('noop'),
  WHATSAPP_API_URL: z.string().url().default('https://graph.facebook.com/v21.0'),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),

  CRON_SECRET: z.string().optional(),
  NOTIFICATION_REMINDER_HOURS: z.coerce.number().int().positive().default(24),
  NOTIFICATION_QUEUE_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  NOTIFICATION_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  AUDIT_LOG_READS: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(1825),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;
let configurationWarnings: string[] = [];

function readRawEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET_LOGOS: process.env.SUPABASE_STORAGE_BUCKET_LOGOS,
    SUPABASE_STORAGE_BUCKET_ATTACHMENTS: process.env.SUPABASE_STORAGE_BUCKET_ATTACHMENTS,
    SUPABASE_STORAGE_BUCKET_DOCUMENTS: process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS,
    STORAGE_SIGNED_URL_TTL_SECONDS: process.env.STORAGE_SIGNED_URL_TTL_SECONDS,
    MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,
    WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
    WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
    WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    NOTIFICATION_REMINDER_HOURS: process.env.NOTIFICATION_REMINDER_HOURS,
    NOTIFICATION_QUEUE_BATCH_SIZE: process.env.NOTIFICATION_QUEUE_BATCH_SIZE,
    NOTIFICATION_MAX_ATTEMPTS: process.env.NOTIFICATION_MAX_ATTEMPTS,
    AUDIT_LOG_READS: process.env.AUDIT_LOG_READS,
    AUDIT_RETENTION_DAYS: process.env.AUDIT_RETENTION_DAYS,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(readRawEnv());
  configurationWarnings = [];

  if (parsed.success) {
    cachedEnv = parsed.data;
  } else {
    configurationWarnings = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    // Valores padrão garantem que a aplicação continue navegável.
    cachedEnv = envSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    });
  }

  if (!isSupabaseConfigured()) {
    configurationWarnings.push(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local',
    );
  }

  return cachedEnv;
}

export function getConfigurationWarnings(): string[] {
  getEnv();
  return [...configurationWarnings];
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && url.startsWith('http') && !url.includes('xxxxxxxx'));
}

export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && key.length > 20 && !key.includes('exemplo'));
}

export function getAppUrl(): string {
  return getEnv().NEXT_PUBLIC_APP_URL;
}

export function getStorageSignedUrlTtl(): number {
  return getEnv().STORAGE_SIGNED_URL_TTL_SECONDS;
}

export function getMaxUploadSizeBytes(): number {
  return getEnv().MAX_UPLOAD_SIZE_MB * 1024 * 1024;
}
