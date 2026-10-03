import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

type CookieParaDefinir = { name: string; value: string; options?: CookieOptions };

const ROTAS_PUBLICAS = ['/login', '/configuracao-pendente', '/api/auth/login', '/api/webhooks'];

function isPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));
}

function supabaseConfigurado(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && chave && url.startsWith('http'));
}

/**
 * Middleware de sessão: renova os tokens do Supabase a cada navegação e protege
 * as rotas privadas. Quando o Supabase ainda não está configurado, a navegação
 * segue livre para que a tela de configuração seja exibida.
 */
export async function middleware(request: NextRequest) {
  if (!supabaseConfigurado()) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieParaDefinir[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Record<string, unknown>),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;

  if (!user && !isPublica(caminho)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', caminho);
    return NextResponse.redirect(url);
  }

  if (user && caminho === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
