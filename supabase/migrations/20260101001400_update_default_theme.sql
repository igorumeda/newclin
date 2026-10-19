-- Novo tema padrão para redes criadas após a atualização do catálogo.
-- Os presets personalizados existentes são preservados.
alter table public.redes alter column tema set default '{
  "preset": "oceano",
  "light": {
    "primary": "218 80% 42%",
    "primaryForeground": "0 0% 100%",
    "secondary": "190 24% 92%",
    "secondaryForeground": "190 35% 18%",
    "accent": "190 35% 94%",
    "accentForeground": "190 45% 22%",
    "background": "218 20% 98%",
    "foreground": "218 25% 12%",
    "border": "218 16% 84%",
    "sidebar": "218 28% 12%",
    "sidebarForeground": "218 15% 96%"
  },
  "dark": {
    "primary": "210 90% 72%",
    "primaryForeground": "218 25% 8%",
    "secondary": "190 20% 18%",
    "secondaryForeground": "190 25% 92%",
    "accent": "190 24% 20%",
    "accentForeground": "190 35% 90%",
    "background": "218 20% 7%",
    "foreground": "218 15% 96%",
    "border": "218 14% 27%",
    "sidebar": "218 25% 5%",
    "sidebarForeground": "218 15% 96%"
  },
  "presetsPersonalizados": []
}'::jsonb;
