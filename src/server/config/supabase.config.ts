/**
 * Fábricas de clientes Supabase no servidor.
 *  - `createRouteClient`: usa o JWT do usuário (cookies) — a RLS é aplicada.
 *  - `createServiceClient`: usa a service role — apenas jobs, webhooks e
 *    provisionamento de usuários. Nunca deve ser exposto ao client.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv, isSupabaseConfigured, hasServiceRoleKey } from './env.config';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.',
    );
    this.name = 'SupabaseNotConfiguredError';
  }
}

export type SupabaseCookieToSet = { name: string; value: string; options?: CookieOptions };

export function createRouteClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }

  const env = getEnv();
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL as string,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: SupabaseCookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components não podem escrever cookies — o middleware renova a sessão.
          }
        },
      },
    },
  );
}

export function createServiceClient(): SupabaseClient {
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    throw new SupabaseNotConfiguredError();
  }

  const env = getEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Cliente com JWT explícito (usado em jobs e webhooks que agem em nome de um usuário). */
export function createClientWithToken(accessToken: string): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new SupabaseNotConfiguredError();
  }

  const env = getEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL as string, env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export type AppSupabaseClient = SupabaseClient;
