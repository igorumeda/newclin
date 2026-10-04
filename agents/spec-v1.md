# Especificação Funcional — Clínica SaaS v1.0

## 1. Contexto

Este sistema é um SaaS multi-tenant para gestão de clínicas médicas. A primeira
cliente é uma clínica de médio porte vinculada ao estado que oferece atendimento
gratuito aos pacientes (sem cobrança, sem convênios). O sistema substituirá o
controle atual feito em planilhas Excel.

O produto será comercializado para clínicas de qualquer porte e tipo (públicas e
privadas), portanto a arquitetura deve prever expansão futura para cobrança e
convênios, mesmo que a v1.0 não implemente essas funcionalidades.

## 2. Objetivo da v1.0

Entregar um sistema funcional que permita à clínica:
- Cadastrar e gerenciar pacientes, profissionais e unidades de atendimento
- Controlar a agenda de consultas de forma centralizada e multi-unidade
- Registrar atendimentos clínicos em prontuário eletrônico com templates
  personalizáveis por especialidade
- Emitir documentos clínicos (receitas, atestados, solicitações de exames)
- Comunicar-se com pacientes via WhatsApp e e-mail (confirmações e lembretes)
- Personalizar a aparência do sistema com as cores e logotipo da organização
- Visualizar relatórios operacionais básicos

## 3. Regras de Negócio por Módulo

### 3.1 Organização (Multi-tenancy)

- O sistema opera com a hierarquia: **Rede → Unidades → Profissionais**.
- Uma **Rede** representa a organização/empresa (tenant). Cada rede tem seus
  próprios dados isolados. Nenhuma informação de uma rede é acessível por outra.
- Uma rede pode ter **múltiplas unidades** (filiais, postos de atendimento).
- Um **profissional** pertence à rede e pode atuar em uma ou mais unidades.
  Seus horários de atendimento e agenda são configurados por unidade.
- Um **paciente** pertence à rede (não à unidade). Ele pode ser atendido em
  qualquer unidade da rede e seu prontuário é único e compartilhado entre
  todas as unidades.
- Cada rede possui configurações próprias: tema de cores, logotipo, templates
  de prontuário e tipos de atendimento.

### 3.2 Usuários e Permissões

- Todo usuário está vinculado a uma única rede.
- O login oferece **Esqueceu sua senha?**. O usuário informa seu e-mail,
  recebe um link de recuperação e define uma nova senha com confirmação.
  A solicitação não revela se o e-mail existe. A troca exige uma sessão
  válida com vínculo ativo, altera apenas a senha e retorna ao login.
- O convite por e-mail abre o formulário de conclusão do cadastro, com nome,
  telefone opcional, senha e confirmação de senha. E-mail, rede e permissões
  são definidos pelo administrador. O link precisa validar uma identidade
  convidada ativa; após concluir, o usuário entra com sua senha no login.
  O envio mantém apenas a identidade pendente do Supabase Auth: o cadastro
  interno (`profiles`) e o acesso à rede só são criados após a conclusão.
  As permissões do convite são mantidas em metadados exclusivos do backend.
- Existem quatro papéis (roles):
  - **Admin da Rede**: acesso total a todas as unidades, configurações,
    usuários e relatórios da rede.
  - **Gestor de Unidade**: acesso às unidades que lhe foram atribuídas.
    Pode gerenciar agenda, pacientes e relatórios dessas unidades. Não
    acessa configurações globais da rede.
  - **Médico/Profissional**: acesso à sua própria agenda e aos prontuários
    dos pacientes que atende. Pode visualizar cadastro de pacientes mas
    não pode excluir. Pode emitir documentos clínicos.
  - **Recepção**: acesso à agenda e ao cadastro de pacientes das unidades
    que lhe foram atribuídas. Pode agendar, confirmar e cancelar consultas.
    **Não tem acesso ao conteúdo clínico do prontuário** (evolução,
    anamnese, diagnóstico). Pode visualizar apenas dados cadastrais do
    paciente e histórico de agendamentos.
- Um usuário pode ter acesso a múltiplas unidades (campo de `unidades_acesso`).
- Profissionais de saúde possuem campos adicionais: número do conselho de
  classe (CRM, CRO, etc.), especialidade e unidades onde atuam.
- Toda ação sensível no sistema (acesso a prontuário, alteração de dados,
  exclusão) deve ser registrada em log de auditoria com: quem, quando, o quê
  e de qual unidade.

### 3.3 Pacientes

- Campos obrigatórios: nome completo, CPF, data de nascimento, sexo.
- Campos opcionais: telefone, e-mail, endereço completo, nome do responsável
  (obrigatório para menores de 18 anos), telefone do responsável, alergias
  conhecidas, condições crônicas, observações gerais.
- **Detecção de duplicidade**: ao cadastrar ou importar um paciente, o sistema
  deve verificar se já existe um paciente com o mesmo CPF na rede. Se existir,
  deve alertar o usuário e impedir o cadastro duplicado. Como fallback,
  verificar combinação de nome + data de nascimento.
- **Importação via CSV/Excel**: o sistema deve permitir importar uma planilha
  de pacientes. O usuário mapeia as colunas da planilha para os campos do
  sistema. O processo deve gerar um relatório com: total importado, total
  ignorado (duplicados), total com erro (campos inválidos) e detalhes de
  cada erro.
- Pacientes podem ser inativados (soft delete), nunca excluídos fisicamente.
- A busca de pacientes deve funcionar por nome (parcial, case-insensitive)
  e por CPF (exato).

### 3.4 Agenda

- A agenda é organizada por **profissional + unidade + data**.
- Cada rede define seus **tipos de atendimento** (ex: consulta, retorno,
  procedimento, avaliação). Cada tipo tem uma duração padrão em minutos e
  uma cor para identificação visual.
- O horário de atendimento de cada profissional é configurado por unidade
  (ex: Dr. João atende seg/qua na Unidade A e ter/qui na Unidade B).
- **Bloqueios**: é possível bloquear horários na agenda de um profissional
  para uma unidade (férias, congresso, almoço, manutenção). O bloqueio
  impede novos agendamentos no período.
- **Fluxo de status do agendamento** (transições permitidas):
  ```
  agendado → confirmado → aguardando → em_atendimento → finalizado
     ↓           ↓            ↓              ↓
  cancelado   cancelado   cancelado      cancelado
     ↓
   faltou
  ```
- **Regra de conflito**: não é possível agendar dois atendimentos para o
  mesmo profissional na mesma unidade com horários sobrepostos. O sistema
  deve validar e rejeitar com mensagem clara.
- **Encaixe**: a recepção pode encaixar um paciente em um horário já ocupado
  (sobrecarga), mas o sistema deve exibir um aviso visual de conflito.
- A visão da agenda deve permitir filtros por profissional, unidade e tipo
  de atendimento, com visualizações diária e semanal.
- **Painel de recepção**: tela com a lista de pacientes do dia, mostrando
  status, tempo de espera desde o check-in e ordem de chegada.

### 3.5 Prontuário e Templates

- O prontuário é vinculado ao **paciente** (único por rede) e cada
  **atendimento** é uma entrada no prontuário.
- **Motor de templates dinâmicos**:
  - Um template é composto por uma lista ordenada de **seções**, e cada
    seção contém uma lista de **campos**.
  - Tipos de campo suportados: texto curto, texto longo, número, data,
    seleção única (dropdown), seleção múltipla (checkboxes), escala
    (1-10), sim/não, e anexo de arquivo.
  - Cada campo possui: rótulo, tipo, obrigatoriedade, valor padrão e
    opções (para seleção).
  - Templates são configuráveis por **especialidade**. O sistema deve
    fornecer templates padrão para as especialidades mais comuns (clínica
    geral, pediatria, ginecologia, ortopedia, dermatologia, cardiologia,
    psiquiatria).
  - A rede pode criar, clonar, editar e inativar templates próprios.
  - Ao iniciar um atendimento, o médico seleciona o template (ou o sistema
    sugere com base na especialidade do profissional).
- **Evolução clínica**:
  - Campos fixos em todo atendimento: queixa principal, anamnese, exame
    físico, hipótese diagnóstica (código CID), conduta/orientações.
  - Os campos do template dinâmico complementam os campos fixos.
  - Os dados preenchidos são armazenados como estrutura JSON versionada
    (deve guardar a versão do template usado no momento do preenchimento).
- **Imutabilidade**: após o atendimento ser finalizado, a evolução não pode
  ser editada. Correções são feitas via **adendo** (nova entrada datada e
  assinada que referencia o atendimento original).
- **Anexos**: é possível anexar arquivos (imagens, PDFs de exames, fotos)
  ao atendimento ou ao paciente. Limite de tamanho por arquivo: 10 MB.
  Tipos permitidos: PDF, JPG, PNG, DICOM (futuro).

### 3.6 Documentos Clínicos

- O sistema deve gerar os seguintes documentos em PDF:
  - **Receita médica**: com dados do profissional, unidade, paciente,
    lista de medicamentos (nome, dosagem, posologia, duração) e data.
  - **Atestado médico**: com diagnóstico (CID), período de afastamento
    e finalidade.
  - **Solicitação de exames**: com lista de exames solicitados e
    justificativa clínica.
  - **Declaração de comparecimento**: com data, hora de entrada e saída.
- Todos os documentos devem conter cabeçalho com: logotipo da rede, nome
  da unidade, endereço e telefone.
- Os documentos são vinculados ao atendimento e ao paciente e ficam
  disponíveis no histórico do prontuário.
- O conteúdo do documento é editável antes da emissão. Após emitido,
  torna-se imutável (o PDF gerado é armazenado).

### 3.7 Temas e Personalização

- Cada rede pode configurar um **tema de cores** que será aplicado a todo
  o sistema para os usuários daquela rede.
- O tema altera apenas **cores** (primária, secundária, acento, fundo,
  texto, bordas, sidebar). Não altera tipografia, espaçamentos ou layout.
- O sistema oferece 10 presets padrão protegidos: Oceano, Jade Suave, Íris,
  Areia Quente, Aurora, Petróleo, Âmbar, Lavanda, Prata e Cobalto.
  As paletas mantêm a mesma família de cor no claro e no escuro, com
  superfícies distintas para fundo, cards e menus. Jade Suave, Areia Quente
  e Prata têm barra lateral pastel no claro e mais suave que o fundo no escuro.
  Eles podem ser aplicados e duplicados, mas não editados. A rede pode
  criar presets próprios e editar livremente as suas cores nos dois modos.
- Cada rede pode fazer upload do seu **logotipo**, que será exibido na
  sidebar, no cabeçalho e nos documentos clínicos emitidos.
- A configuração de tema e logotipo é restrita ao papel Admin da Rede.
- A troca de tema deve ser refletida em tempo real sem necessidade de
  recarregar a página.

### 3.8 Relatórios

- Relatórios disponíveis na v1.0:
  - Total de atendimentos por período, filtrável por unidade e profissional.
  - Taxa de faltas e cancelamentos por período e por profissional.
  - Novos pacientes cadastrados por mês.
  - Distribuição de atendimentos por tipo e por especialidade.
  - Produtividade por profissional (atendimentos/dia).
- Todos os relatórios são filtráveis por período (data início/fim) e por
  unidade.
- O acesso a relatórios é restrito a Admin da Rede e Gestor de Unidade
  (este último vê apenas dados das suas unidades).

## 4. Integrações com Serviços Externos

Todas as integrações com serviços externos devem ser realizadas
exclusivamente pela camada de API interna (backend). O frontend nunca
deve se comunicar diretamente com serviços de terceiros.

### 4.1 E-mail (SMTP)

- **Finalidade**: envio de confirmação de agendamento, lembrete de consulta
  e documentos clínicos ao paciente.
- **Configuração**: cada rede poderá configurar suas credenciais SMTP
  (host, porta, usuário, senha, remetente) nas configurações da rede.
  Na v1.0, usar uma configuração global do sistema é aceitável.
- **Templates de e-mail**: o sistema deve possuir templates internos para
  cada tipo de comunicação (confirmação, lembrete). Os templates devem
  suportar variáveis dinâmicas (nome do paciente, data/hora, profissional,
  unidade).
- **Envio assíncrono**: o envio de e-mails deve ser enfileirado e processado
  de forma assíncrona para não bloquear a resposta da API.
- **Log**: todo e-mail enviado deve ser registrado com status (enviado,
  falha), destinatário, assunto e timestamp.

### 4.2 WhatsApp

- **Finalidade**: confirmação de agendamento e lembrete de consulta.
- **Integração**: utilizar API oficial (Meta Cloud API) ou provedor BSP
  compatível (ex: Twilio, Z-API, 360dialog). A implementação deve ser
  feita por meio de uma interface (port) que permita trocar o provedor
  sem alterar a regra de negócio.
- **Fluxo de confirmação**:
  1. O sistema envia uma mensagem ao paciente com os dados da consulta
     (data, hora, profissional, unidade) e botões de confirmação
     (confirmar / cancelar).
  2. A resposta do paciente (via webhook do provedor) deve atualizar
     automaticamente o status do agendamento no sistema.
- **Lembrete**: enviado automaticamente 24 horas antes da consulta para
  agendamentos com status "agendado" ou "confirmado".
- **Envio assíncrono e enfileirado**, assim como o e-mail.
- **Log**: toda mensagem enviada e recebida deve ser registrada com
  conteúdo, status, destinatário e timestamp.
- **Fallback**: se o envio por WhatsApp falhar, o sistema deve tentar
  enviar por e-mail (se o paciente tiver e-mail cadastrado).

### 4.3 Storage de Arquivos

- **Finalidade**: armazenamento de logotipos das redes, anexos de prontuário
  (exames, fotos) e PDFs de documentos clínicos gerados.
- **Organização**: os arquivos devem ser organizados por rede e, quando
  aplicável, por paciente. Estrutura sugerida:
  - `logos/{rede_id}/`
  - `anexos/{rede_id}/{paciente_id}/`
  - `documentos/{rede_id}/`
- **Segurança**: o acesso aos arquivos deve ser restrito a usuários da
  mesma rede. URLs públicas não são permitidas para anexos de prontuário.
  Utilizar URLs assinadas com tempo de expiração.
- **Validação**: o backend deve validar tipo MIME e tamanho do arquivo
  antes de armazenar. Rejeitar qualquer arquivo que não esteja na lista
  de tipos permitidos.

## 5. Regras Transversais

- **Isolamento de dados (multi-tenancy)**: toda query ao banco de dados
  deve filtrar por `rede_id`. Nenhum dado de uma rede pode ser acessado
  por usuários de outra rede. Esta regra é inviolável e deve ser
  garantida tanto na camada de aplicação quanto no banco de dados (RLS).
- **LGPD**: dados de saúde são classificados como sensíveis. O sistema
  deve:
  - Registrar o consentimento do paciente no cadastro.
  - Permitir exportação dos dados do paciente em formato legível.
  - Manter log de acesso a prontuários (quem acessou, quando, de onde).
  - Criptografar dados sensíveis em trânsito (HTTPS) e em repouso.
- **Soft delete**: nenhuma entidade de negócio deve ser excluída
  fisicamente do banco de dados. Utilizar campo `deleted_at` ou
  `inativo` para exclusão lógica.
- **Auditoria**: toda criação, alteração e exclusão de registros deve
  ser registrada em tabela de auditoria com: usuário, ação, entidade,
  ID do registro, timestamp e dados alterados (antes/depois).
- **Campos de controle**: todas as tabelas de negócio devem possuir
  `created_at`, `updated_at` e `rede_id`.
- **Fonte pagadora**: todo atendimento deve possuir o campo
  `fonte_pagadora` com valor padrão `publico` na v1.0. Este campo
  será expandido na v2.0 para suportar `particular` e `convenio`.
  Não implementar lógica de cobrança na v1.0.
- **Fuso horário**: o sistema deve armazenar datas em UTC e exibir no
  fuso horário da unidade de atendimento.

## 6. Escopo Negativo (NÃO entra na v1.0)

As seguintes funcionalidades estão explicitamente fora do escopo da v1.0
e não devem ser implementadas, mas a arquitetura deve permitir sua
adição futura sem refatoração significativa:

- Cobrança, faturamento e controle financeiro
- Gestão de convênios e tabelas de preços
- Emissão de guias TISS
- Agendamento online pelo paciente (portal do paciente)
- Telemedicina / videochamada
- Integração com laboratórios (recebimento automático de resultados)
- Controle de estoque de medicamentos e materiais
- Assinatura digital com certificado ICP-Brasil
- Aplicativo mobile nativo (a v1.0 é web + PWA)
- Prontuário offline / sincronização

## 7. Modelo de Dados Conceitual

Entidades principais e seus relacionamentos:

```
Rede (1) ──── (N) Unidade
  │                    │
  │                    ├── (N) BloqueioAgenda
  │                    │
  ├──── (N) Profissional ── (N) UnidadeAtuacao
  │           │
  │           ├── (N) Agendamento ── (1) Paciente
  │           │         │
  │           │         └── (1) Atendimento
  │           │                  ├── (N) Evolucao
  │           │                  ├── (N) Anexo
  │           │                  └── (N) Documento
  │           │
  ├──── (N) Paciente
  │           ├── (N) Anexo
  │           └── (N) Agendamento
  │
  ├──── (N) TemplateProntuario
  ├──── (N) TipoAtendimento
  ├──── (N) Usuario (Profile)
  └──── (1) Tema
```

Atributos chave por entidade:

- **Rede**: id, nome, cnpj, tema (JSON), logotipo_url, config (JSON)
- **Unidade**: id, rede_id, nome, endereco, telefone, ativo
- **Profissional**: id, rede_id, nome, conselho_classe, numero_conselho,
  especialidade, ativo
- **Paciente**: id, rede_id, nome, cpf, data_nascimento, sexo, telefone,
  email, responsavel_nome, responsavel_telefone, alergias,
  condicoes_cronicas, consentimento_lgpd
- **Agendamento**: id, rede_id, unidade_id, profissional_id, paciente_id,
  tipo_atendimento_id, data_hora_inicio, data_hora_fim, status,
  observacoes
- **Atendimento**: id, rede_id, unidade_id, agendamento_id, paciente_id,
  profissional_id, template_id, dados_preenchidos (JSON),
  fonte_pagadora (default: 'publico'), status, finalizado_em
- **TemplateProntuario**: id, rede_id, nome, especialidade,
  estrutura (JSON), ativo
- **TipoAtendimento**: id, rede_id, nome, duracao_minutos, cor, ativo
- **Documento**: id, rede_id, paciente_id, atendimento_id,
  profissional_id, tipo, conteudo (JSON), pdf_url
- **Usuario/Profile**: id (auth), rede_id, role, unidades_acesso[],
  profissional_id
