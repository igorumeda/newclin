# Clínica SaaS v1.0

Sistema **multi-tenant** para redes de clínicas: agenda, recepção, prontuário eletrônico
dinâmico, documentos clínicos em PDF, relatórios e integrações — construído sobre
**Next.js 14 (App Router) + Supabase (Postgres, Auth e Storage)**.

> Hierarquia de dados: **Rede → Unidades → Profissionais**. Todas as tabelas de negócio
> carregam `rede_id`, e o isolamento acontece em duas camadas: **aplicação** (contexto de
> requisição) e **banco de dados** (Row Level Security).

---

## 1. Pré-requisitos

| Recurso | Versão mínima | Observação |
| --- | --- | --- |
| Node.js | 20.x | `node -v` |
| npm | 10.x | vem com o Node 20 |
| Projeto Supabase | — | [supabase.com/dashboard](https://supabase.com/dashboard) — plano gratuito é suficiente |
| CLI do Supabase | 1.180+ | **opcional**, apenas para rodar o stack local com Docker |

---

## 2. Instalação

```bash
git clone <url-do-repositorio> newclin
cd newclin
npm ci
cp .env.example .env.local     # depois preencha o arquivo (passo 3)
```

---

## 3. Variáveis de ambiente

O arquivo [`.env.example`](./.env.example) é a referência completa e comentada de **todas**
as variáveis. As obrigatórias para subir a aplicação são:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...         # Project Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...             # Project Settings → API → service_role (secreta!)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Onde encontrar cada valor:

| Variável | Local no painel do Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API → Project API keys → `anon` `public`** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → Project API keys → `service_role`** |
| `DATABASE_URL` | **Project Settings → Database → Connection string → URI** (só para migrations via `psql`) |

> **Segurança:** a `service_role` ignora RLS. Ela é usada **exclusivamente no servidor**
> (convite de usuários, jobs, webhooks e upload de logotipo) e nunca é enviada ao navegador —
> o arquivo `src/server/config/env.config.ts` só expõe variáveis `NEXT_PUBLIC_*` ao client.

Integrações opcionais (o sistema funciona sem elas, registrando as mensagens no log):

- **SMTP** (`SMTP_*`) — envio de confirmações, lembretes e documentos por e-mail.
- **WhatsApp** (`WHATSAPP_*`) — `WHATSAPP_PROVIDER=noop` em desenvolvimento; `meta`,
  `zapi`, `twilio` ou `360dialog` em produção. O webhook fica em
  `POST /api/webhooks/whatsapp`.
- **Cron** (`CRON_SECRET`) — protege os jobs de fila e lembretes.

---

## 4. Banco de dados, autenticação e storage

As migrations em [`supabase/migrations/`](./supabase/migrations) criam **tudo**: tabelas,
índices, triggers, funções, políticas de RLS, buckets de Storage e view de relatórios.

| # | Migration | Conteúdo |
| --- | --- | --- |
| `…000000` | `init_extensions_and_helpers` | extensões (`pgcrypto`, `btree_gist`, `unaccent`), helpers de `updated_at`, `current_rede_id()`, `current_user_role()`, `has_unit_access()` |
| `…000100` | `organization` | `redes`, `unidades`, `unidades_acesso`, tema (`jsonb`) e configurações da rede |
| `…000200` | `users_and_permissions` | `usuarios` (perfil espelhado de `auth.users`), permissões por papel e vínculo com profissionais |
| `…000300` | `patients` | `pacientes`, responsáveis, consentimento LGPD, RPCs de busca/duplicidade/exportação de dados |
| `…000400` | `scheduling` | `tipos_atendimento`, `horarios_unidade`, `agendamentos` (exclusão por `GiST`), `bloqueios`, painel de recepção |
| `…000500` | `medical_records` | `templates_prontuario` (estrutura `jsonb` versionada), `atendimentos`, `evolucoes`, `anexos` |
| `…000600` | `clinical_documents` | `documentos` (numerados por trigger), `documentos_emitidos` imutáveis |
| `…000700` | `notifications` | `notificacoes`, `modelos_mensagem`, fila assíncrona e log de envios |
| `…000800` | `audit` | `audit_logs` com `dados_antes`/`dados_depois` e retenção configurável |
| `…000900` | `rls_policies` | RLS habilitado + 50 políticas de isolamento por rede/unidade nas **19 tabelas** |
| `…001000` | `storage` | buckets `logos` (público, 5 MB), `anexos` e `documentos` (privados, 10 MB) + políticas por prefixo de caminho |
| `…001100` | `reports` | views e funções de relatórios (atendimentos, faltas, produtividade, distribuição) |
| `…001200` | `patient_lgpd_export` | `exportar_dados_paciente()` — JSON completo do paciente (LGPD); fica no fim por depender de agenda, prontuário e documentos |

### 4.1 Projeto Supabase remoto (recomendado)

```bash
npx supabase login                       # abre o navegador do Supabase
npx supabase link --project-ref <ref>    # <ref> aparece na URL do painel
npx supabase db push                     # aplica as 12 migrations
```

### 4.2 Sem a CLI: SQL Editor

1. Painel do Supabase → **SQL Editor → New query**.
2. Cole o conteúdo de cada migration **na ordem numérica** e execute (uma por vez).
3. Confirme em **Table Editor** a criação de `redes`, `unidades`, `pacientes`, `agendamentos`…

### 4.3 Stack local completo (Docker)

```bash
npx supabase start     # sobe Postgres 15, Auth, Storage e Studio
npx supabase db reset  # aplica migrations + supabase/seed.sql
```

O `reset` executa o [seed](./supabase/seed.sql) com uma rede de demonstração e quatro
usuários (senha `ChangeMe!2026`):

| E-mail | Papel |
| --- | --- |
| `admin@clinica.exemplo.com` | Admin da Rede |
| `gestor@clinica.exemplo.com` | Gestor de Unidade |
| `medico@clinica.exemplo.com` | Médico/Profissional |
| `recepcao@clinica.exemplo.com` | Recepção |

> O seed é **apenas para desenvolvimento**. Em produção, o primeiro acesso é feito pelo
> usuário criado no **Authentication → Users** do Supabase com `raw_user_meta_data`
> contendo `rede_id` e `role` (veja o comentário no topo do `seed.sql`).

### 4.4 Storage

Os buckets e as políticas são criados pela migration `…001000_storage.sql`; nada precisa ser
feito no painel. Convenção de caminhos aplicada por política:

```
logos/{rede_id}/{arquivo}
anexos/{rede_id}/{paciente_id}/{arquivo}
documentos/{rede_id}/{arquivo}
```

Arquivos privados são servidos por **URLs assinadas** com validade de
`STORAGE_SIGNED_URL_TTL_SECONDS` (padrão 600 s), com validação de MIME (`pdf`, `jpeg`, `png`)
e tamanho (`MAX_UPLOAD_SIZE_MB`, padrão 10 MB).

---

## 5. Executando

```bash
npm run dev          # http://localhost:3000  (aceita acesso pela rede local)
npm run build        # build de produção
npm start            # servidor de produção
```

| Script | Função |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `0.0.0.0:3000` |
| `npm run build` / `npm start` | Build e execução em produção |
| `npm run typecheck` | `tsc --noEmit` (modo estrito) |
| `npm run lint` | ESLint + regras de dependência entre camadas |
| `npm run format` | Prettier |
| `npm run db:push` / `db:reset` / `db:new` | Atalhos para a CLI do Supabase |

Acesse `/login`. Após autenticar, cada papel é direcionado para sua área inicial:
Admin da Rede e Gestor → `/dashboard`, Profissional → `/agenda`, Recepção → `/recepcao`.

---

## 6. Jobs assíncronos

Notificações (e-mail e WhatsApp) saem por fila. Configure um agendador externo — o
`CRON_SECRET` é exigido no header `Authorization: Bearer <CRON_SECRET>`:

```bash
# Enfileira lembretes de consultas que acontecem nas próximas 24h
curl -X POST https://sua-app.com/api/jobs/notificacoes/lembretes \
  -H "Authorization: Bearer $CRON_SECRET"

# Processa a fila de mensagens pendentes
curl -X POST https://sua-app.com/api/jobs/notificacoes/fila \
  -H "Authorization: Bearer $CRON_SECRET"
```

No Supabase, o **Cron** (pg_cron + pg_net) ou o **GitHub Actions** resolvem o agendamento
com duas chamadas por hora.

---

## 7. Arquitetura

O projeto segue **Clean Architecture + DDD** com domínio isomórfico (sem dependências de
runtime), detalhado em [`agents/ARCHITECTURE.md`](./agents/ARCHITECTURE.md):

```
src/
├── @core/                 # núcleo compartilhado: Entity, AggregateRoot, Result,
│                          # ValueObject, UseCase, Controller, erros de domínio
├── modules/<modulo>/      # um diretório por contexto delimitado
│   ├── domain/            # entidades, VOs, eventos e contratos (puro, sem I/O)
│   ├── application/       # casos de uso, DTOs e validadores Zod
│   ├── server/            # repositórios Supabase, mappers, controllers e rotas
│   └── client/            # hooks e serviços HTTP do módulo
├── server/                # config, middlewares, adaptador de rotas e container de DI
├── client/                # UI (design system), providers, stores e hooks
└── app/                   # rotas Next.js (App Router) — só orquestração
```

Módulos: `organization`, `user`, `professional`, `patient`, `scheduling`, `medical-record`,
`clinical-document`, `notification`, `report`, `audit`.

Regras inegociáveis do projeto (validadas por `npm run lint`):

- dependências apontam **sempre para dentro** (`app → server → application → domain`);
- erros de negócio usam **Result Pattern**, nunca `throw` no domínio;
- `src/app/**` não contém regra de negócio — apenas validação Zod + `handleRoute`;
- respostas sempre no envelope `{ data, meta }` ou `{ error: { code, message, details } }`;
- toda ação sensível gera registro em `audit_logs` (antes/depois).

### Design system

[`agents/design-system.md`](./agents/design-system.md) define a stack de UI (Tailwind 3.4,
shadcn/ui, Radix, Lucide, TanStack Query v5 e Table v8, React Hook Form + Zod, Zustand,
Framer Motion, Sonner). Regras: **somente tokens CSS** (nunca cores fixas), dark mode
obrigatório, mobile-first, WCAG 2.1 AA e reuso das primitivas em `src/client/ui/`.

O tema por rede (apenas cores) é aplicado em tempo real pelo `TemaProvider`, a partir de
`redes.tema` (`jsonb`) — Admin da Rede edita em `/configuracoes`, com 4 presets e
personalização livre de `primary`, `accent` e `sidebar`.

---

## 8. Funcionalidades da v1.0

| Área | Rota | Destaques |
| --- | --- | --- |
| Dashboard | `/dashboard` | Indicadores do dia, taxa de faltas (30 d), gráficos |
| Pacientes | `/pacientes` | Busca (nome parcial/CPF), CPF obrigatório com detecção de duplicidade, LGPD, exportação, importação CSV/Excel com mapeamento de colunas |
| Agenda | `/agenda` | Visões dia/semana, tipos de atendimento com cor, detecção de conflito com `GiST`, encaixe com aviso visual, bloqueios |
| Recepção | `/recepcao` | Fila do dia, check-in, tempo de espera, ordem de chegada |
| Atendimentos | `/atendimentos` | Prontuário dinâmico por template, rascunho/finalização/cancelamento, evolucoes e adendos (pós-finalização) |
| Documentos | `/documentos` | Receita, atestado, solicitação de exames, declaração — PDF imutável após emissão |
| Templates | `/templates-prontuario` | Templates por especialidade, clonagem, inativação, versionamento |
| Profissionais | `/profissionais` | Conselhos, especialidades, horários por unidade, cores da agenda |
| Unidades e usuários | `/unidades`, `/usuarios` | CRUD, acesso por unidade, convite por e-mail |
| Relatórios | `/relatorios` | Atendimentos, faltas, novos pacientes, distribuição, produtividade (Admin/Gestor) |
| Notificações | `/notificacoes` | Fila, modelos de mensagem, reenvio, lembretes de 24h |
| Auditoria | `/auditoria` | Trilha com filtros, diff antes/depois e paginação |
| Configurações | `/configuracoes` | Tema da rede, logotipo, tipos de atendimento |

Permissões: 30 ações granulares por papel (`admin_rede`, `gestor_unidade`, `profissional`,
`recepcao`), aplicadas no menu, nas páginas e em cada rota de API. A Recepção **não** acessa
conteúdo clínico.

---

## 9. Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [`agents/spec-v1.md`](./agents/spec-v1.md) | Especificação funcional e regras de negócio da v1.0 |
| [`agents/ARCHITECTURE.md`](./agents/ARCHITECTURE.md) | Camadas, padrões, Result Pattern, DI e convenções |
| [`agents/design-system.md`](./agents/design-system.md) | Tokens, componentes e regras de UI |
| [`AGENTS.md`](./AGENTS.md) | Guia rápido para agentes e contribuidores |

---

## 10. Fora do escopo da v1.0

Cobrança/faturamento, convênios e TISS, portal do paciente, telemedicina, laboratórios,
estoque, assinatura ICP-Brasil, app nativo (somente web + PWA) e uso offline.
