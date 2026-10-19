import { getEnv } from '@/server/config/env.config';

type AuthLayoutProps = { children: React.ReactNode };

export default function AuthLayout({ children }: AuthLayoutProps) {
  const supabaseUrl = getEnv().NEXT_PUBLIC_SUPABASE_URL;
  const imagemFundo = supabaseUrl
    ? new URL('/storage/v1/object/public/images/login-background.jpg', supabaseUrl).toString()
    : null;

  return (
    <div className="auth-screen flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <section
        aria-hidden
        className="relative isolate hidden flex-1 flex-col justify-between overflow-hidden bg-primary bg-cover bg-center bg-no-repeat p-10 text-primary-foreground lg:flex"
        style={imagemFundo ? { backgroundImage: `url(${JSON.stringify(imagemFundo)})` } : undefined}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/85 via-primary/65 to-primary/90" />
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">Clínica SaaS</p>
          <h1 className="max-w-lg text-3xl font-semibold leading-tight">
            Agenda, recepção, prontuário eletrônico e documentos clínicos em um só lugar.
          </h1>
          <p className="max-w-md text-sm opacity-90">
            Plataforma multi-rede para clínicas: atendimento organizado, prontuário versionado e
            relatórios de gestão — com trilha de auditoria e conformidade LGPD.
          </p>
        </div>
        <ul className="space-y-2 text-sm opacity-90">
          <li>· Prontuário dinâmico com templates por especialidade</li>
          <li>· Receitas, atestados e solicitações de exames em PDF</li>
          <li>· Confirmação por e-mail e WhatsApp com fila assíncrona</li>
        </ul>
      </section>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">{children}</main>
    </div>
  );
}
