# AI Adventure — Documento de especificação

> Documento de referência para dar continuidade ao projeto em novas conversas.
> Última atualização: 2026-08-24

---

## 1. Visão geral

**AI Adventure** é um sistema pessoal para desenvolver projetos de software usando
agentes de IA de forma padronizada e reutilizável, ao invés de resolver cada
projeto do zero. A metáfora do projeto é de aventura/RPG: guildas definem
padrões, heróis (agentes) executam missões (aplicações) seguindo esses padrões.

**Objetivo duplo:**

1. Ter um pipeline real e funcional para criar projetos pessoais mais rápido e
   com mais consistência.
2. Servir como peça de portfólio para currículo, visando empresas globais —
   por isso a decisão de manter todo artefato de código em inglês.

**Status atual:** conceito validado através de um MVP completo (ideação →
deploy). Em fase de desenho da versão "real" do sistema, começando pela
estrutura de Guilds como pacote/CLI.

---

## 2. Terminologia (glossário)

| Termo                              | Definição                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guild**                          | Conjunto de padrões e decisões reutilizáveis (arquitetura, segurança, estilo de código, etc.) que qualquer Quest deve seguir. Não contém código de aplicação. |
| **Quest**                          | Uma aplicação/projeto individual construído a partir dos padrões das Guilds (antes chamado de "Program").                                                     |
| **Quest Brief**                    | O documento de requisitos de uma Quest (antes chamado de "PRD").                                                                                              |
| **Chronicle** _(nome provisório)_  | Registro de propostas de melhoria a uma Guild, geradas durante o desenvolvimento de uma Quest, aguardando revisão humana.                                     |
| **Guildhall** _(nome provisório)_  | O repositório central onde as Guilds vivem, empacotado como CLI instalável.                                                                                   |
| **Checkpoint** _(nome provisório)_ | Gate humano de revisão dentro do fluxo de desenvolvimento.                                                                                                    |

**Em aberto:** nomes temáticos para os agentes (Product, Architect, Builder,
QA, Reviewer, Ops, Docs), nome final do repositório de Guilds, nome final do
arquivo de propostas.

---

## 3. O que é e o que não é uma Guild

**Uma Guild é:**

- Uma fonte de verdade sobre _como fazer_, não sobre _o que construir_.
- Agnóstica de produto — nunca sabe qual Quest específica vai consumi-la.
- Consultável por agentes antes de agir (o valor só existe se for lida).
- Versionável e evolutiva.
- Prescritiva, não apenas descritiva.

**Uma Guild não é:**

- Código de aplicação ou lógica de negócio específica de uma Quest.
- Uma Quest em si (não roda, não tem deploy).
- Uma decisão pontual válida para um único projeto (isso vai no Quest Brief).
- Um repositório de "tudo que pode ser útil depois" (nasce de repetição real).
- Estática — deve evoluir quando uma Quest revela uma lacuna nela.

**Teste rápido:** _"Se eu criar 5 Quests completamente diferentes, essa regra
se aplicaria igual a todas elas?"_ Se sim → Guild. Se depende do projeto → é
decisão específica da Quest.

### 3.1 Guilds condicionais

Algumas regras se aplicam apenas a Quests de um determinado _tipo_ (ex: Quests
com interface visual, Quests que expõem API pública). Isso ainda é considerado
Guild, desde que a regra seja consistente para todo Quest daquele tipo — não é
uma exceção arbitrária. Cada Guild condicional deve declarar seu escopo
explicitamente:

```markdown
# UX/Frontend Guild

> Aplica-se a: Quests com interface visual (web, mobile)
> Não se aplica a: APIs puras, scripts, CLIs internos
```

O tipo de Quest é declarado no Quest Brief (campo `tipo`) e usado pelo CLI
para decidir quais Guilds condicionais copiar na criação da Quest.

---

## 4. Lista de Guilds

**Núcleo (core) — aplicam-se a toda Quest:**

1. Architecture Guild — estrutura de pastas, camadas, contratos de API
2. Security Guild — auth, secrets, dependências, práticas de segurança
3. Data Guild — modelagem, migrations, backup, retenção
4. Ops/Infra Guild — CI/CD, deploy, ambientes
5. Testing/QA Guild — estratégia de testes, cobertura mínima
6. Monitoring/Observability Guild — logs, métricas, alertas
7. Code Style Guild — linters, formatters, convenções, **política de idioma**
8. AI/Agents Guild — como a IA é usada no pipeline, prompts padrão

**Condicionais — aplicam-se conforme o tipo de Quest:** 9. UX/Frontend Guild — só para Quests com interface visual 10. Documentation Guild — formato de README, ADRs 11. Product/Ideation Guild — padrão de como uma ideia vira Quest Brief

---

## 5. Fluxo de desenvolvimento de uma Quest

| #   | Etapa                                                      | Executor                                                                                |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Ideação — ideia solta em 2-3 frases                        | Você                                                                                    |
| 2   | Quest Brief — transformar ideia em documento de requisitos | Agente "Product" (consulta Product/Ideation Guild)                                      |
| 3   | Design de arquitetura                                      | Agente "Architect" (consulta Architecture + Data Guild)                                 |
| 4   | **Checkpoint** — aprovação de brief + arquitetura          | Você                                                                                    |
| 5   | Scaffold da Quest (estrutura, configs, CI/CD base)         | Agente "Builder" (consulta Code Style, Ops/Infra, Security Guild)                       |
| 6   | Implementação feature a feature                            | Agente "Builder"                                                                        |
| 7   | Geração de testes                                          | Agente "QA" (consulta Testing/QA Guild)                                                 |
| 8   | Revisão de código                                          | Agente "Reviewer" (checklist de Security + Code Style, incluindo verificação de idioma) |
| 9   | **Checkpoint** — revisão geral pré-deploy                  | Você                                                                                    |
| 10  | Deploy                                                     | Agente "Ops" (consulta Ops/Infra Guild)                                                 |
| 11  | Monitoramento pós-deploy                                   | Agente "Ops" (consulta Monitoring Guild)                                                |
| 12  | Documentação final                                         | Agente "Docs" (consulta Documentation Guild)                                            |
| —   | Registro de propostas de melhoria às Guilds                | Qualquer agente, a qualquer momento do processo                                         |

**Regra de divisão de implementação (passo 6):** separar por camada, não por
feature — primeiro lógica pura (`/lib`), depois UI consumindo essa lógica.
Facilita revisão e testes.

---

## 6. Mecanismo de aprendizado (Guild ← Quest)

1. Durante o desenvolvimento, qualquer agente que perceber uma oportunidade
   de padrão reutilizável registra uma proposta no arquivo `guild-proposals.md`
   (dentro do repositório da própria Quest), no formato:

   ```markdown
   ## Proposta: <título>

   **Guild afetada**: <nome da guild>
   **Contexto**: <o que motivou a proposta>
   **Regra proposta**: <a regra em si>
   **Evidência**: <Quest e data>
   **Teste de generalização**: <por que se aplicaria a outras Quests>
   ```

2. Periodicamente, você roda uma revisão consolidada das propostas de todas
   as Quests (comando de CLI a definir).
3. Você decide: aceitar (vira regra na Guild, com bump de versão e changelog),
   rejeitar (fica registrado pra não repetir a discussão) ou adiar.
4. Quests existentes não são atualizadas automaticamente — ficam fixas na
   versão da Guild que instalaram, a menos que você rode uma atualização
   manual.

**Princípio:** captura é automática (qualquer agente pode propor), promoção é
sempre humana (evita degradar as Guilds com regras isoladas ou não testadas
em múltiplos contextos).

---

## 7. Distribuição das Guilds — decisão arquitetural

**Modelo escolhido: Guilds como pacote/CLI instalável.**

- As Guilds vivem em um repositório central (nome provisório: `guildhall`),
  publicado como pacote (npm ou equivalente, mesmo que só localmente).
- Um CLI expõe comandos como:
  - `init` — copia as Guilds relevantes (core + condicionais conforme tipo de
    Quest) para dentro de um novo projeto.
  - `update` — atualiza uma Quest existente para a versão mais recente das
    Guilds.
  - `review-proposals` — consolida propostas (`guild-proposals.md`) de todas
    as Quests conhecidas para revisão humana.
- As Guilds são versionadas (semver), permitindo que uma Quest fique fixada
  numa versão específica mesmo que as Guilds evoluam depois.

**Por que essa escolha:** resolve o problema de sincronizar melhorias entre
múltiplas Quests manualmente, e dá histórico real (changelog) da evolução dos
padrões da fábrica — o que o modelo de "pasta de arquivos" ou "monorepo único"
não oferece de forma nativa.

**Próximo passo técnico:** desenhar a estrutura de pastas do repositório
`guildhall` e o esqueleto do CLI.

---

## 8. Política de idioma

- **Todo artefato do repositório é em inglês**: código, nomes de
  variáveis/funções, comentários, testes, mensagens de commit, documentação
  (README, Quest Brief, documentos de Guild, ADRs), mensagens de erro
  voltadas ao usuário final.
- **A conversa com o desenvolvedor (chat, discussões de decisão) permanece em
  português** — não é considerada artefato do repositório.
- Essa regra deve constar explicitamente na Code Style Guild (ou em uma seção/
  arquivo próprio de convenções gerais).
- O agente "Reviewer" deve checar vazamento de português em código/comentários/
  docs como item do checklist de revisão.

---

## 9. Aprendizados do MVP (validação do conceito)

MVP executado: calculadora com histórico de sessão, do zero ao deploy na
Vercel, usando Claude Code + 3 Guild minis (Architecture, Code Style,
Security).

**O que foi validado:**

- O mecanismo de "ler a Guild antes de agir" funciona na prática — o agente
  seguiu os padrões definidos e sinalizou explicitamente decisões não cobertas
  pelos documentos (ex: necessidade de `eslint-config-prettier` para evitar
  conflito ESLint/Prettier).
- Separar lógica pura (`/lib`) de UI facilitou tanto a implementação quanto a
  geração de testes depois.
- Checkpoints humanos entre arquitetura/scaffold e pré-deploy foram suficientes
  para manter controle sem microgerenciar cada etapa.
- Deploy contínuo via Vercel (push → deploy automático) já cobre boa parte do
  que seria uma Ops/Infra Guild real, sem esforço de configuração.

**Lacunas identificadas (viraram matéria-prima para o mecanismo de propostas
descrito na seção 6):**

- Regras de Prettier não estavam explícitas no `code-style.md` (o agente usou
  defaults e documentou a decisão).
- Dependência `eslint-config-prettier` não estava prevista em nenhuma Guild.

---

## 10. Validação/enforcement das regras de Guild

Nem toda regra de Guild é verificável por máquina. Cada regra deve carregar
uma tag explícita de enforcement, para deixar claro o que é fato checável e
o que depende de julgamento:

- **`automated`** — checagem mecânica via CI/CD (linters, scanners, testes).
  Ex: formatação (ESLint/Prettier), secrets vazados (gitleaks), cobertura de
  testes, contraste de cor e ARIA roles (axe-core, eslint-plugin-jsx-a11y).
- **`automated (custom)`** — objetiva, mas exige script/ferramenta própria.
  Ex: checar que lógica de negócio não vaza para dentro de componentes React
  (dependency-cruiser ou script customizado), estrutura de pastas obrigatória.
- **`agent-reviewed`** — depende de julgamento; validada pelo agente Reviewer
  e/ou pelos Checkpoints humanos. Ex: hierarquia visual, qualidade da decisão
  de arquitetura, aderência aos critérios de aceite do Quest Brief.
- **`agent-recommended, human-confirmed`** — o agente detecta o problema e
  propõe a ação, mas não a executa sozinho; um humano precisa confirmar antes
  de rodar. Reservada para ações com impacto direto e potencialmente
  irreversível fora do ambiente de desenvolvimento (ex: rollback de produção
  na Ops/Infra Guild). Diferente de `agent-reviewed`: aqui não é uma questão
  de qualidade de julgamento, é uma barreira deliberada contra execução
  autônoma de ações de alto risco — mesmo que o agente esteja certo.

**Caso de destaque — UX/Frontend Guild:** é a Guild condicional com maior
potencial de automação. Estrutura sugerida em duas partes:

- Um arquivo de **tokens** (cores, espaçamento, tipografia) como valores
  objetivos — não em prosa — que o lint valida contra hardcoding.
- Um arquivo `accessibility.md` com regras de acessibilidade, a maioria
  `automated` via axe-core/Lighthouse CI, algumas `agent-reviewed` (ex:
  experiência real com leitor de tela).

Regras `agent-reviewed` que se mostrarem consistentes ao longo de várias
Quests são candidatas a "amadurecer" para `automated` — isso também pode
virar proposta para o Chronicle (seção 6).

---

## 11. Decisões em aberto

- Nomes temáticos finais para os agentes (Architect, Builder, QA, Reviewer,
  Ops, Docs) e para os demais elementos provisórios (Chronicle, Guildhall,
  Checkpoint).
- Estrutura de pastas do repositório `guildhall` e esqueleto do CLI.
- Nível de automação da orquestração de agentes (ainda não decidido — opções
  discutidas: scripts simples, slash commands por agente, ou orquestrador
  automático completo).
- Nome final do projeto (trabalhando com "AI Adventure" como proposta).
- **Design system para a UX/Frontend Guild** — decisão adiada de propósito.
  Começar apenas pelos tokens (cores, espaçamento, tipografia), automatizáveis
  via lint. Componentes reais (Button, Input, Card...) só devem ser extraídos
  para um design system depois de se repetirem de forma consistente em 2-3
  Quests com UI — mesmo princípio de generalização usado para promover
  propostas ao Chronicle (seção 6). Revisitar após ter Quests reais com
  interface visual.

---

## 12. Como retomar este projeto em uma nova conversa

Ao iniciar uma nova conversa, anexe este documento e informe em qual seção
das "Decisões em aberto" (seção 10) você quer continuar, ou descreva o próximo
passo desejado. Este documento reflete o estado da especificação até a data
indicada no topo — decisões tomadas em conversas futuras devem ser
incorporadas de volta aqui para manter a continuidade.
