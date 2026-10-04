-- Atualiza somente o padrão das novas redes; temas já salvos são reconstituídos
-- pelo catálogo atual, preservando os presets personalizados de cada rede.
alter table public.redes alter column tema set default '{
  "preset": "oceano",
  "light": {
    "primary": "205 80% 35%",
    "primaryForeground": "0 0% 100%",
    "secondary": "205 24% 91%",
    "secondaryForeground": "205 35% 22%",
    "accent": "198 38% 91%",
    "accentForeground": "205 45% 24%",
    "background": "205 28% 96%",
    "foreground": "205 30% 16%",
    "border": "205 18% 79%",
    "sidebar": "205 32% 18%",
    "sidebarForeground": "205 22% 96%"
  },
  "dark": {
    "primary": "205 78% 70%",
    "primaryForeground": "205 25% 8%",
    "secondary": "205 22% 23%",
    "secondaryForeground": "205 24% 94%",
    "accent": "198 30% 25%",
    "accentForeground": "198 38% 91%",
    "background": "205 26% 11%",
    "foreground": "205 22% 94%",
    "border": "205 18% 35%",
    "sidebar": "205 30% 9%",
    "sidebarForeground": "205 22% 94%"
  },
  "presetsPersonalizados": []
}'::jsonb;
