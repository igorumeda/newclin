import { Tema } from '@/modules/organization/domain/value-objects/tema.vo';
import type { TemaProps } from '@/modules/organization/domain/value-objects/tema.vo';
import { obterImagemPublica } from '@/shared/utils/public-images.util';
import { criarTokensTema } from './tema-tokens';

export const REDE_TEMA_STYLE_ID = 'rede-tema-dark';
export const REDE_FAVICON_ID = 'rede-favicon';
export const FAVICON_PADRAO_URL =
  obterImagemPublica({
    caminho: 'logotipo/mini_logotipo_icone_bg_transparent.png',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  }) ?? '/icons/icone.svg';

type AplicarTemaParams = { tema: TemaProps };
type CarregarLogotipoParams = { url: string | null; signal: AbortSignal };
type AplicarFaviconParams = { url: string | null };

export function aplicarFaviconDaRede({ url }: AplicarFaviconParams): void {
  const href = url?.trim() ? url.trim() : FAVICON_PADRAO_URL;
  const seletor =
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]';
  const links = document.head.querySelectorAll<HTMLLinkElement>(seletor);
  if (links.length === 0) {
    const link = document.createElement('link');
    link.id = REDE_FAVICON_ID;
    link.rel = 'icon';
    link.href = href;
    document.head.appendChild(link);
    return;
  }
  links.forEach((link) => {
    link.removeAttribute('type');
    link.href = href;
  });
}

export function removerFaviconDaRede(): void {
  aplicarFaviconDaRede({ url: null });
}

export function aplicarTemaDaRede({ tema }: AplicarTemaParams): void {
  const atual = Tema.reconstitute(tema);
  const light = criarTokensTema({ cores: atual.light, modo: 'light' });
  const dark = criarTokensTema({ cores: atual.dark, modo: 'dark' });
  for (const token of Object.keys(light))
    document.documentElement.style.removeProperty(token);
  let tag = document.getElementById(REDE_TEMA_STYLE_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement('style');
    tag.id = REDE_TEMA_STYLE_ID;
    document.head.appendChild(tag);
  }
  const declaracoesLight = Object.entries(light)
    .map(([token, valor]) => `${token}: ${valor};`)
    .join(' ');
  const declaracoesDark = Object.entries(dark)
    .map(([token, valor]) => `${token}: ${valor};`)
    .join(' ');
  tag.textContent = `:root { ${declaracoesLight} } :root.dark { ${declaracoesDark} }`;
}

/** Aguarda download e decodificação antes de montar a barra lateral. */
export function carregarLogotipo({ url, signal }: CarregarLogotipoParams): Promise<void> {
  if (!url) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    const limpar = () => {
      clearTimeout(limite);
      imagem.onload = null;
      imagem.onerror = null;
      signal.removeEventListener('abort', cancelar);
    };
    const falhar = () => {
      limpar();
      reject(new Error('Não foi possível carregar o logotipo da rede.'));
    };
    const cancelar = () => {
      limpar();
      reject(new Error('Carregamento cancelado.'));
    };
    const limite = setTimeout(falhar, 15000);
    signal.addEventListener('abort', cancelar, { once: true });
    if (signal.aborted) {
      cancelar();
      return;
    }
    imagem.onerror = falhar;
    imagem.onload = async () => {
      try {
        await imagem.decode();
        limpar();
        resolve();
      } catch {
        falhar();
      }
    };
    imagem.src = url;
  });
}
