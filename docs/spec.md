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
deploy). O `guildhall` (repositório de Guilds como CLI instalável) está
construído e testado — comandos `init`, `update` e `review-proposals`
funcionais. As 9 Guilds core + Documentation estão completas, incluindo
uma segunda passada de revisão nas 3 Guilds originais do MVP (Architecture,
Security, Code Style), que nasceram como versões "mini" e foram elevadas
ao mesmo padrão de rigor das demais. Restam apenas as Guilds condicionais
UX/Frontend e Product/Ideation em rascunho. Nenhuma Quest real (além do
MVP) foi construída ainda com o sistema completo.

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

### 3.2 Formato padrão de um documento de Guild

Emergiu organicamente ao longo das primeiras revisões e deve ser seguido
por toda Guild nova ou revisada a partir de agora:

1. **Cabeçalho** — `Applies to`, opcionalmente `Scope:` (quando nem toda
   regra vale para todo tipo de Quest que a guild afirma cobrir — ver
   Architecture Guild como referência), e `Status` (`draft` | `active`).
2. **Purpose** — o que a guild define e, quando fizer sentido, como ela
   se relaciona com guilds que já assumem suas regras (evita repetir o
   conteúdo de outra guild só para dar contexto).
3. **Rules** — cada regra com uma tag `> Enforcement:` (ver seção 10).
   Regras devem incluir o "porquê", não só o "o quê", quando a
   justificativa não for óbvia.
4. **Out of scope** — dividido em dois grupos, não misturados:
   - **"Real gap, not a conscious decision"** — o que falta porque
     ninguém chegou lá ainda (ex: a Architecture Guild não define stack
     para Quests `cli`/`script`).
   - **"Conscious minimum-scope decisions"** — o que foi deliberadamente
     deixado de fora, com justificativa (segue o teste de generalização
     da seção 3).
5. **Enforcement maturity** — quais regras `agent-reviewed` são
   candidatas a virar `automated`, e por quê; quando uma regra é
   mecânica o suficiente para automatizar na hora (não como candidato
   futuro), ela é implementada diretamente — não fica esperando um ciclo
   futuro só porque "ainda não tinha sido feito assim".
6. **Proposal log** — referência padrão à seção 6.

**Sincronização cruzada:** quando uma guild fecha uma pendência deixada
em aberto por outra ("Out of scope" apontando "belongs to Guild X"), a
guild de origem deve ser atualizada no mesmo commit — não só a que está
fechando a pendência. Formalizado na AI/Agents Guild, com um check
automatizado no próprio guildhall (limitação conhecida: o check confirma
que o arquivo de origem foi tocado, não que a referência foi de fato
substituída por um ponteiro real — ver `guild-proposals.md` do próprio
guildhall).

---

## 4. Lista de Guilds

**Núcleo (core) — aplicam-se a toda Quest — todas completas:**

1. Architecture Guild ✅
2. Security Guild ✅
3. Data Guild ✅
4. Ops/Infra Guild ✅
5. Testing/QA Guild ✅
6. Monitoring/Observability Guild ✅
7. Code Style Guild ✅
8. AI/Agents Guild ✅

**Condicionais — aplicam-se conforme o tipo de Quest:** 9. Documentation Guild ✅ 10. Product/Ideation Guild ✅ 11. UX/Frontend Guild — em rascunho (única pendente)

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

**Status:** implementado e testado. O CLI (`bin/cli.js`, sem dependências
externas) expõe `init`, `update` e `review-proposals`; o `guildhall init`
já foi validado copiando as 11 guilds do manifesto para um projeto novo,
com `.guildhall-lock.json` registrando a versão instalada.

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
  Ops, Docs) e para os demais elementos provisórios (Chronicle, Checkpoint).
  `Guildhall` já está em uso consistente havia várias revisões — considerar
  promovido de "provisório" para definitivo.
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
- **Duas Guilds condicionais ainda em rascunho**: UX/Frontend e
  Product/Ideation (o prompt desta última já foi gerado mas ainda não
  executado).
- **Stack padrão para Quests `cli` e `script`** — gap real (não decisão
  consciente) identificado durante a revisão da Architecture Guild: o
  manifesto lista essas guilds como aplicáveis a todo tipo de Quest, mas
  Architecture, Code Style e outras só definem conteúdo para `web-app`/
  `api`. Só deve ser resolvido quando uma Quest desse tipo for realmente
  tentada, não especulado agora.
- **`guild-proposals.md` do próprio guildhall** — distinto dos
  `guild-proposals.md` por Quest: acumula propostas sobre o próprio
  mecanismo de guilds (ex: a limitação do check de sincronização cruzada
  descoberta na revisão da Documentation Guild). Ainda não existe como
  arquivo real no repositório, só como conceito referenciado pela
  AI/Agents Guild — criar e popular com os itens já identificados.

---

## 12. Como retomar este projeto em uma nova conversa

Ao iniciar uma nova conversa, anexe este documento e informe em qual seção
das "Decisões em aberto" (seção 10) você quer continuar, ou descreva o próximo
passo desejado. Este documento reflete o estado da especificação até a data
indicada no topo — decisões tomadas em conversas futuras devem ser
incorporadas de volta aqui para manter a continuidade.
