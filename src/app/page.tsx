import { LandingPage } from '@/client/components/landing/landing-page';
import { getEnv } from '@/server/config/env.config';
import { obterCatalogoImagensPublicas } from '@/shared/utils/public-images.util';

export default function HomePage() {
  const supabaseUrl = getEnv().NEXT_PUBLIC_SUPABASE_URL;
  const imagens = obterCatalogoImagensPublicas({ supabaseUrl });

  return <LandingPage imagens={imagens} />;
}
