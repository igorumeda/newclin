# Clínica — SaaS multi-tenant de gestão clínica (v1.0)

Sistema completo para **redes de clínicas**: hierarquia Rede → Unidades → Profissionais,
agenda, prontuário eletrônico com templates dinâmicos, documentos clínicos em PDF,
notificações (e-mail e WhatsApp), relatórios e auditoria/LGPD.

A arquitetura segue estritamente `AGENTS.md` e `agents/ARCHITECTURE.md`
(Clean Architecture + DDD + domínio isomórfico) e o `agents/design-system.md`.

---

## 1. Como rodar

```bash
# 1. dependências
npm install

# 2. variáveis de ambiente
cp .env.example .env     # preencha o que for usar (veja a seção 3)

# 3. banco: estrutura + dados fictícios
npm run db:reset         # reset + migrate + seed
#  ou, separadamente:
#  npm run db:migrate    # somente a estrutura (migrations/*.sql)
#  npm run db:seed       # somente os dados de teste (scripts/seed.ts)

# 4. aplicação
npm run dev              # http://localhost:3000

# 5. (opcional) worker da fila de notificações, em outro terminal
npm run worker:notificacoes
```

Sem `DATABASE_URL`, o sistema sobe com **PGlite** (PostgreSQL embarcado, pasta `.pglite/`),
sem precisar de servidor de banco. Em produção, basta preencher `DATABASE_URL`
que o driver `postgres` (pool `pg`) é usado automaticamente.

### Acessos criados pelo seed

| E-mail | Papel | Senha |
| --- | --- | --- |
| `admin@saudeviva.com.br` | Admin da Rede | `Clinica@2025` |
| `gestor@saudeviva.com.br` | Gestor de Unidade | `Clinica@2025` |
| `medico@saudeviva.com.br` | Médico | `Clinica@2025` |
| `recepcao@saudeviva.com.br` | Recepção | `Clinica@2025` |

O seed cria 1 rede, 3 unidades, 7 profissionais, 7 templates de prontuário
(cobrindo os 9 tipos de campo), 36 pacientes, ~180 agendamentos distribuídos
entre -30 e +14 dias, atendimentos finalizados com adendos, documentos emitidos,
bloqueios de agenda, notificações e registros de auditoria.

---

## 2. Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução em produção |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript |
| `npm run db:migrate` | Aplica `migrations/*.sql` (controle em `_migrations`) |
| `npm run db:seed` | Insere os dados fictícios (`scripts/seed.ts`) |
| `npm run db:reset` | Recria o schema + migrate + seed |
| `npm run worker:notificacoes` | Processa a fila de e-mail/WhatsApp em loop |

Alternativa ao worker em ambientes serverless:
`POST /api/v1/cron/notificacoes` com o header `x-cron-secret: $CRON_SECRET`.

---

## 3. Integrações (preencha no `.env`)

| Integração | Variáveis | Padrão offline |
| --- | --- | --- |
| Banco | `DATABASE_DRIVER`, `DATABASE_URL`, `DATABASE_SSL`, `PGLITE_DATA_DIR` | PGlite local |
| Sessão | `AUTH_JWT_SECRET`, `AUTH_COOKIE_NAME`, `AUTH_SESSION_TTL_HOURS` | JWT HS256 em cookie httpOnly |
| E-mail | `EMAIL_DRIVER`, `SMTP_*` | `log` (imprime no console) |
| WhatsApp | `WHATSAPP_PROVIDER` (`meta`/`zapi`/`log`), `WHATSAPP_*` | `log` |
| Storage | `STORAGE_DRIVER` (`local`/`s3`), `STORAGE_*`, `S3_*` | disco em `./storage` |
| Notificações | `NOTIFICACOES_*`, `CRON_SECRET` | worker a cada 30s |

Trocar de provedor de WhatsApp **não exige mudança de código**: basta implementar
a porta `IWhatsAppProvider` (adaptadores Meta Cloud API e Z-API já incluídos).

---

## 4. Estrutura

```text
migrations/            Estrutura do banco (SQL puro, versionado)
scripts/               migrate.ts · reset.ts · seed.ts · worker-notificacoes.ts
src/@core/             Classes base isomórficas (Entity, VO, Result, UseCase, Mapper…)
src/shared/            Utilidades e constantes sem regra de negócio
src/modules/<modulo>/
  domain/              Entidades, VOs, agregados, eventos, serviços, repositórios (interfaces)
  application/         Use cases, mappers e DTOs
  server/
    api/controllers/   Controllers HTTP (um por recurso)
    infrastructure/    Persistência (models/mappers/repos) e providers
  client/
    services/          ApiService (única ponte com a API)
    dtos/              Request/Response DTOs do client
    ui/                Páginas, componentes e formulários do módulo
src/server/            config · api (base HTTP) · infrastructure (db, storage) · di · bootstrap
src/client/            providers · hooks · config · ui (layout, forms, data-display…)
src/components/ui/     Primitivas do design system (shadcn/Radix)
src/app/               App Router: páginas e rotas /api/v1/*
```

Módulos: `auth`, `rede`, `unidade`, `profissional`, `paciente`, `agenda`,
`prontuario`, `documento`, `notificacao`, `relatorio`, `auditoria`.

### Pontos de arquitetura

- **Domínio isomórfico**: os Value Objects (`Cpf`, `Email`, `Periodo`, `Senha`…) validam
  no servidor e são reutilizados nos formulários do client.
- **Result Pattern**: erros de negócio nunca são exceptions; `Result<T>` atravessa as camadas.
- **Multi-tenant**: todo acesso HTTP abre `db.withTenant({ redeId })` — transação com
  `set_config('app.rede_id', …)`, ativando as políticas de **RLS** (`migrations/0009_rls.sql`).
- **Composition root**: `src/server/di/container.ts` é o único lugar que instancia
  implementações concretas; `src/server/bootstrap/route-handler.ts` liga o App Router
  aos controllers, abre a transação e grava auditoria + acesso a prontuário (LGPD).
- **Sem imports entre módulos**: dados de outros módulos vêm de projeções SQL de leitura
  do próprio módulo (ex.: `IAgendaConsultaRepository`, `IDadosEmissaoRepository`).

---

## 5. Funcionalidades

- **Pacientes**: cadastro único por rede, detecção de duplicidade por CPF (e nome+nascimento),
  importação de CSV com mapeamento de colunas e relatório, exportação LGPD, exclusão lógica.
- **Agenda**: tipos de atendimento, bloqueios, encaixe com aviso visual, validação de conflitos,
  fluxo `agendado → confirmado → aguardando → em_atendimento → finalizado` (+ `cancelado`/`faltou`),
  visões dia/semana e painel da recepção com filas e check-in.
- **Prontuário**: motor de templates dinâmicos (9 tipos de campo, seções, versionamento),
  campos clínicos fixos, imutabilidade após finalização com adendos, anexos (PDF/JPG/PNG ≤ 10 MB).
- **Documentos**: receita, atestado, solicitação de exames e declaração de comparecimento em PDF
  (`pdf-lib`) com cabeçalho da rede, imutáveis após emissão e servidos por URL assinada.
- **Notificações**: outbox assíncrono, templates com variáveis, lembrete de 24h,
  webhook de WhatsApp que confirma/cancela o agendamento, fallback para e-mail e logs.
- **Relatórios**: atendimentos por período, faltas/cancelamentos, novos pacientes por mês,
  distribuição por tipo/especialidade e produtividade por profissional.
- **Tema por rede**: 4 presets + troca em tempo real (somente Admin da Rede), logotipo.
- **LGPD/auditoria**: consentimento, exportação, log de todas as ações e de cada acesso a
  prontuário, soft delete em todas as tabelas de negócio.

Fora do escopo da v1 (mantidos extensíveis): faturamento, convênios/TISS, portal do paciente,
telemedicina, integração com laboratórios, estoque, assinatura ICP-Brasil, app nativo e
prontuário offline.
