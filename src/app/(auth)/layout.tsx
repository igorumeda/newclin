export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-screen flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <section
        aria-hidden
        className="hidden flex-1 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex"
      >
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
