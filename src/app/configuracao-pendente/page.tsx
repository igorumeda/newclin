import Link from 'next/link';
import { CheckCircle2, Database, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/client/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/client/ui/feedback';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import { getConfigurationWarnings, hasServiceRoleKey, isSupabaseConfigured } from '@/server/config/env.config';

export const dynamic = 'force-dynamic';

const GRUPOS = [
  {
    titulo: 'Supabase (obrigatório)',
    icone: Database,
    variaveis: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ],
  },
  {
    titulo: 'E-mail (opcional)',
    icone: Mail,
    variaveis: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'],
  },
  {
    titulo: 'WhatsApp (opcional)',
    icone: MessageCircle,
    variaveis: [
      'WHATSAPP_PROVIDER',
      'WHATSAPP_API_URL',
      'WHATSAPP_API_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    ],
  },
  {
    titulo: 'Jobs e auditoria (opcional)',
    icone: ShieldCheck,
    variaveis: ['CRON_SECRET', 'AUDIT_LOG_READS', 'AUDIT_RETENTION_DAYS'],
  },
];

/**
 * Tela exibida quando a aplicação sobe sem as credenciais do Supabase.
 * Ajuda quem acabou de clonar o repositório a concluir o setup descrito no README.
 */
export default function ConfiguracaoPendentePage() {
  const avisos = getConfigurationWarnings();
  const bancoOk = isSupabaseConfigured();
  const serviceRoleOk = hasServiceRoleKey();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <Badge variant={bancoOk ? 'success' : 'warning'}>
          {bancoOk ? 'Banco configurado' : 'Configuração pendente'}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Configuração do ambiente</h1>
        <p className="text-sm text-muted-foreground">
          A aplicação precisa das credenciais do projeto Supabase para autenticar, ler e gravar dados. O arquivo
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">.env.example</code>
          lista todas as variáveis com comentários.
        </p>
      </div>

      <Alert variant={bancoOk ? 'success' : 'warning'}>
        <AlertTitle>{bancoOk ? 'Supabase conectado' : 'Ainda faltam credenciais'}</AlertTitle>
        <AlertDescription>
          {bancoOk ? (
            <span>
              As variáveis públicas do Supabase estão definidas. A gravação de dados administrativos depende
              ainda da chave <code>SUPABASE_SERVICE_ROLE_KEY</code>, atualmente{' '}
              {serviceRoleOk ? 'definida' : 'ausente'}.
            </span>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {avisos.length > 0 ? (
                avisos.map((aviso) => <li key={aviso}>{aviso}</li>)
              ) : (
                <li>Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.</li>
              )}
            </ul>
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Passo a passo</CardTitle>
          <CardDescription>Leva cerca de cinco minutos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Crie (ou abra) um projeto no{' '}
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
              >
                painel do Supabase
              </a>
              .
            </li>
            <li>
              Copie <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.example</code> para{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code> e preencha a URL do
              projeto, a chave <em>anon</em> e a chave <em>service_role</em> (
              <span className="text-muted-foreground">Project Settings → API</span>).
            </li>
            <li>
              Aplique as migrations do banco: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npx supabase db push</code>{' '}
              — ou rode os arquivos de <code>supabase/migrations</code> no SQL Editor, em ordem.
            </li>
            <li>Reinicie o servidor de desenvolvimento para carregar as variáveis.</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline">
              <Link href="/login">Ir para o login</Link>
            </Button>
            <Button asChild variant="ghost">
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                Abrir o Supabase
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {GRUPOS.map((grupo) => (
          <Card key={grupo.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <grupo.icone className="size-4 text-primary" aria-hidden />
                {grupo.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {grupo.variaveis.map((variavel) => (
                  <li key={variavel} className="flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="size-3 text-muted-foreground/60" aria-hidden />
                    {variavel}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        A documentação completa (migrations, storage, jobs e arquitetura) está no{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">README.md</code>.
      </p>
    </main>
  );
}
