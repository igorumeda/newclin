export type ObterImagemPublicaParams = {
  caminho: string;
  supabaseUrl?: string;
};

export type ObterCatalogoImagensParams = {
  supabaseUrl?: string;
};

export type ImagensPublicasSistema = {
  logotipo: {
    padraoTransparente: string | null;
    miniTransparente: string | null;
    padraoAzul: string | null;
    miniAzul: string | null;
    padraoBranco: string | null;
    miniBranco: string | null;
    iconeTransparente: string | null;
    miniIconeTransparente: string | null;
    iconeAzul: string | null;
    miniIconeAzul: string | null;
    iconeBranco: string | null;
    miniIconeBranco: string | null;
  };
  business: {
    loginBackground: string | null;
    medicaTablet: string | null;
    medicoConsultorio: string | null;
    medicaPrancheta: string | null;
    medicoJovem: string | null;
    medicoSenior: string | null;
  };
};

export function obterImagemPublica({
  caminho,
  supabaseUrl,
}: ObterImagemPublicaParams): string | null {
  const base = supabaseUrl?.trim();
  if (!base || !base.startsWith('http')) return null;
  const limpo = caminho.replace(/^\/+/, '');
  return new URL(`/storage/v1/object/public/images/${limpo}`, base).toString();
}

export function obterCatalogoImagensPublicas({
  supabaseUrl,
}: ObterCatalogoImagensParams): ImagensPublicasSistema {
  return {
    logotipo: {
      padraoTransparente: obterImagemPublica({
        caminho: 'logotipo/logotipo_bg_transparent.png',
        supabaseUrl,
      }),
      miniTransparente: obterImagemPublica({
        caminho: 'logotipo/mini_logotipo_bg_transparent.png',
        supabaseUrl,
      }),
      padraoAzul: obterImagemPublica({
        caminho: 'logotipo/logotipo_bg_blue.jpg',
        supabaseUrl,
      }),
      miniAzul: obterImagemPublica({
        caminho: 'logotipo/mini_logotipo_bg_blue.jpg',
        supabaseUrl,
      }),
      padraoBranco: obterImagemPublica({
        caminho: 'logotipo/logotipo_bg_white.jpg',
        supabaseUrl,
      }),
      miniBranco: obterImagemPublica({
        caminho: 'logotipo/mini_logotipo_bg_white.jpg',
        supabaseUrl,
      }),
      iconeTransparente: obterImagemPublica({
        caminho: 'logotipo/logotipo_icone_bg_transparent.png',
        supabaseUrl,
      }),
      miniIconeTransparente: obterImagemPublica({
        caminho: 'logotipo/mini_logotipo_icone_bg_transparent.png',
        supabaseUrl,
      }),
      iconeAzul: obterImagemPublica({
        caminho: 'logotipo/logotipo_icone_bg_blue.jpg',
        supabaseUrl,
      }),
      miniIconeAzul: obterImagemPublica({
        caminho: 'logotipo/mini_logotipo_icone_bg_blue.jpg',
        supabaseUrl,
      }),
      iconeBranco: obterImagemPublica({
        caminho: 'logotipo/logotipo_icone_bg_white.jpg',
        supabaseUrl,
      }),
      miniIconeBranco: obterImagemPublica({
        caminho: 'logotipo/mini_logotipo_icone_bg_white.jpg',
        supabaseUrl,
      }),
    },
    business: {
      loginBackground: obterImagemPublica({
        caminho: 'business/login-background.jpg',
        supabaseUrl,
      }),
      medicaTablet: obterImagemPublica({
        caminho:
          'business/min_beautiful-young-female-doctor-looking-camera-office.jpg',
        supabaseUrl,
      }),
      medicoConsultorio: obterImagemPublica({
        caminho: 'business/min_i-love-my-job-so-much.jpg',
        supabaseUrl,
      }),
      medicaPrancheta: obterImagemPublica({
        caminho:
          'business/min_smiley-elder-covid-recovery-center-female-doctor-with-clipboard-stethoscope.jpg',
        supabaseUrl,
      }),
      medicoJovem: obterImagemPublica({
        caminho:
          'business/min_young-handsome-physician-medical-robe-with-stethoscope.jpg',
        supabaseUrl,
      }),
      medicoSenior: obterImagemPublica({
        caminho: 'business/min_old-doctor-uniform-standing-hall.jpg',
        supabaseUrl,
      }),
    },
  };
}

