'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useOrganizacao } from '../hooks/use-organizacao';
import { Button } from '../ui/button';
import {
  aplicarFaviconDaRede,
  aplicarTemaDaRede,
  carregarLogotipo,
  REDE_TEMA_STYLE_ID,
  removerFaviconDaRede,
} from '../styles/rede-identidade';

type RedeThemeProviderProps = { children: ReactNode };

/** Só libera a aplicação quando identidade visual e logotipo estiverem prontos. */
export function RedeThemeProvider({ children }: RedeThemeProviderProps) {
  const pathname = usePathname();
  const {
    redeId,
    ehMaster,
    carregando: carregandoPerfil,
    perfil,
    atualizarPerfil,
    sair,
  } = useAuth();
  const {
    organizacao,
    erro: erroOrganizacao,
    recarregar,
  } = useOrganizacao({ enabled: Boolean(redeId && !ehMaster) });
  const [pronta, setPronta] = useState<string | null>(null);
  const [erroLogo, setErroLogo] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const chave =
    organizacao && organizacao.id === redeId
      ? JSON.stringify([organizacao.id, organizacao.tema, organizacao.logotipoUrl])
      : null;

  useEffect(
    () => () => {
      document.getElementById(REDE_TEMA_STYLE_ID)?.remove();
      removerFaviconDaRede();
    },
    [],
  );

  useEffect(() => {
    if (!ehMaster) return;
    document.getElementById(REDE_TEMA_STYLE_ID)?.remove();
    removerFaviconDaRede();
  }, [ehMaster]);

  useEffect(() => {
    if (ehMaster || !organizacao || !chave) return;
    const controller = new AbortController();
    setErroLogo(false);
    aplicarTemaDaRede({ tema: organizacao.tema });
    void carregarLogotipo({ url: organizacao.logotipoUrl, signal: controller.signal })
      .then(() => {
        if (controller.signal.aborted) return;
        aplicarFaviconDaRede({ url: organizacao.logotipoUrl });
        setPronta(chave);
      })
      .catch(() => {
        if (!controller.signal.aborted) setErroLogo(true);
      });
    return () => controller.abort();
  }, [ehMaster, organizacao, chave, tentativa]);

  useEffect(() => {
    if (ehMaster || !organizacao || pronta !== chave) return;
    aplicarFaviconDaRede({ url: organizacao.logotipoUrl });
  }, [pathname, ehMaster, organizacao, pronta, chave]);

  // Usuário Master não pertence a uma rede específica: libera com tema padrão do sistema.
  if (ehMaster && perfil) return <>{children}</>;

  if (chave && pronta === chave && perfil) return <>{children}</>;

  const erro =
    !carregandoPerfil &&
    (!perfil ||
      (!ehMaster &&
        (erroOrganizacao ||
          erroLogo ||
          (organizacao && organizacao.id !== redeId))));
  return (
    <div className="auth-screen flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        {erro ? (
          <>
            <p role="alert" className="text-sm">
              Não foi possível carregar as configurações da sua rede.
            </p>
            <Button
              onClick={() => {
                setPronta(null);
                setErroLogo(false);
                setTentativa((valor) => valor + 1);
                void atualizarPerfil();
                void recarregar();
              }}
            >
              Tentar novamente
            </Button>
            <Button
              variant="link"
              onClick={async () => {
                await sair();
                window.location.assign('/login');
              }}
            >
              Voltar ao login
            </Button>
          </>
        ) : (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            Carregando…
          </p>
        )}
      </div>
    </div>
  );
}
