export type AppFooterProps = { appNome: string };

export function AppFooter({ appNome }: AppFooterProps) {
  return (
    <footer className="flex h-[var(--footer-height)] items-center justify-between border-t bg-footer px-4 text-xs text-muted-foreground">
      <span>
        {appNome} · versão 1.0 — dados protegidos pela LGPD
      </span>
      <span className="hidden sm:block">Fuso horário exibido conforme a unidade</span>
    </footer>
  );
}
