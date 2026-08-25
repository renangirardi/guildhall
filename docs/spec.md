# AetherForge — Documento de especificação

> Documento de referência para dar continuidade ao projeto em novas conversas.
> Última atualização: 2026-08-25

---

## 1. Visão geral

**AetherForge** é um sistema pessoal para desenvolver projetos de software usando
agentes de IA de forma padronizada e reutilizável, ao invés de resolver cada
projeto do zero. A metáfora do projeto é de aventura/RPG: guildas definem
padrões, heróis (agentes) executam missões (aplicações) seguindo esses padrões.

**Nota de nomenclatura:** "AetherForge" é o nome do projeto/metodologia como um
todo — o que vai pro portfólio, o que descreve o sistema inteiro. `guildhall` é
o nome do repositório central específico dentro do AetherForge, que implementa
o motor de padrões (Guilds) e de orquestração de agentes. A relação é a mesma
de "Kubernetes" e `kubectl`, ou "Docker" e Docker Engine: um nome guarda-chuva
para o projeto, e um nome específico e tecnicamente descritivo para o
repositório/ferramenta central dentro dele. `guildhall` não precisou ser
renomeado quando seu escopo cresceu (de "guardar guilds" para "guardar
guilds e orquestrar agentes") porque a metáfora já comportava isso desde
o início — um guildhall, num RPG, sempre foi também o lugar que despacha
aventureiros para missões, não só um arquivo de regras.

**Objetivo duplo:**

1. Ter um pipeline real e funcional para criar projetos pessoais mais rápido e
   com mais consistência.
2. Servir como peça de portfólio para currículo, visando empresas globais —
   por isso a decisão de manter todo artefato de código em inglês.

**Status atual:** conceito validado através de um MVP completo (ideação →
deploy). O `guildhall` (repositório central do AetherForge) está construído e
testado — comandos `init`, `update` e `review-proposals` funcionais. As 11
Guilds (8 core + 3 condicionais) estão completas, incluindo uma segunda
passada de revisão nas 3 Guilds originais do MVP (Architecture, Security,
Code Style), que nasceram como versões "mini" e foram elevadas ao mesmo
padrão de rigor das demais. Nenhuma Quest real (além do MVP) foi construída
ainda com o sistema completo.

A orquestração de agentes também está implementada (sessão de 2026-08-24,
quatro fases): os 7 subagentes temáticos, a skill orquestradora
`/quest-flow` e a distribuição de ambos via `init`/`update` — ver seção
5.1 e seção 7.

---

## 2. Terminologia (glossário)

| Termo           | Definição                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AetherForge** | Nome definitivo do projeto/metodologia como um todo.                                                                                                          |
| **Guild**       | Conjunto de padrões e decisões reutilizáveis (arquitetura, segurança, estilo de código, etc.) que qualquer Quest deve seguir. Não contém código de aplicação. |
| **Quest**       | Uma aplicação/projeto individual construído a partir dos padrões das Guilds (antes chamado de "Program").                                                     |
| **Quest Brief** | O documento de requisitos de uma Quest (antes chamado de "PRD").                                                                                              |
| **Chronicle**   | Registro de propostas de melhoria a uma Guild (`guild-proposals.md`), geradas durante o desenvolvimento de uma Quest, aguardando revisão humana.              |
| **Guildhall**   | O repositório central específico dentro do AetherForge, onde as Guilds e os templates de orquestração de agentes vivem, empacotado como CLI instalável.       |
| **Checkpoint**  | Gate humano de revisão dentro do fluxo de desenvolvimento (passos 4 e 9).                                                                                     |

**Nomes temáticos dos agentes (definitivos):**

| Papel técnico | Nome temático     | Passo(s) do fluxo |
| ------------- | ----------------- | ----------------- |
| Product       | **Herald**        | 2                 |
| Architect     | **Loremaster**    | 3                 |
| Builder       | **Artificer**     | 5-6               |
| QA            | **Sentinel**      | 7                 |
| Reviewer      | **Warden**        | 8                 |
| Ops           | **Quartermaster** | 10-11             |
| Docs          | **Scribe**        | 12                |

Esses nomes temáticos são também os nomes reais dos arquivos de subagente
do Claude Code em `templates/claude/agents/` (`herald.md`,
`loremaster.md`, `artificer.md`, `sentinel.md`, `warden.md`,
`quartermaster.md`, `scribe.md`) — ver seção 5.1 para como eles são
coordenados.

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

**Condicionais — aplicam-se conforme o tipo de Quest:** 9. Documentation Guild ✅ 10. Product/Ideation Guild ✅ 11. UX/Frontend Guild ✅

**Todas as 11 Guilds estão completas.**

---

## 5. Fluxo de desenvolvimento de uma Quest

| #   | Etapa                                                      | Executor                                                                         |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Ideação — ideia solta em 2-3 frases                        | Você                                                                             |
| 2   | Quest Brief — transformar ideia em documento de requisitos | **Herald** (consulta Product/Ideation Guild)                                     |
| 3   | Design de arquitetura                                      | **Loremaster** (consulta Architecture + Data Guild)                              |
| 4   | **Checkpoint** — aprovação de brief + arquitetura          | Você                                                                             |
| 5   | Scaffold da Quest (estrutura, configs, CI/CD base)         | **Artificer** (consulta Code Style, Ops/Infra, Security Guild)                   |
| 6   | Implementação feature a feature                            | **Artificer**                                                                    |
| 7   | Geração de testes                                          | **Sentinel** (consulta Testing/QA Guild)                                         |
| 8   | Revisão de código                                          | **Warden** (checklist de Security + Code Style, incluindo verificação de idioma) |
| 9   | **Checkpoint** — revisão geral pré-deploy                  | Você                                                                             |
| 10  | Deploy                                                     | **Quartermaster** (consulta Ops/Infra Guild)                                     |
| 11  | Monitoramento pós-deploy                                   | **Quartermaster** (consulta Monitoring Guild)                                    |
| 12  | Documentação final                                         | **Scribe** (consulta Documentation Guild)                                        |
| —   | Registro de propostas de melhoria às Guilds (Chronicle)    | Qualquer agente, a qualquer momento do processo                                  |

**Regra de divisão de implementação (passo 6):** separar por camada, não por
feature — primeiro lógica pura (`/lib`), depois UI consumindo essa lógica.
Facilita revisão e testes.

### 5.1 Orquestração dos agentes — decisão tomada

Resolve o item que estava em "Nível de automação da orquestração de
agentes" na antiga lista de decisões em aberto (seção 11). Decisão:
**automação máxima possível** dentro do fluxo da tabela acima, mantendo
intervenção humana exatamente nos dois Checkpoints (passos 4 e 9) e em
qualquer ação que a AI/Agents Guild já classifica como
`agent-recommended, human-confirmed` (seção 10) — nenhum ponto de parada
adicional foi inventado além desses.

Implementação (sessão de 2026-08-24, quatro fases):

- Cada papel temático da seção 2 é um subagente real do Claude Code, um
  arquivo por papel, em `templates/claude/agents/` — Herald, Loremaster,
  Artificer, Sentinel, Warden, Quartermaster, Scribe.
- Os sete são coordenados por uma skill orquestradora,
  `templates/claude/skills/quest-flow/SKILL.md`, invocável como
  `/quest-flow` (o nome do comando vem do nome do diretório da skill no
  Claude Code, não do campo `name:` do seu frontmatter — por isso não é
  `/quest`).
- Um Checkpoint não é nenhum mecanismo especial de pausa — é só a skill
  apresentando o resultado do passo anterior e terminando o turno; a
  retomada acontece porque o desenvolvedor manda uma nova mensagem, na
  mesma sessão ou em uma futura.
- Progresso é persistido em `.quest-progress.json`, na raiz da própria
  Quest, justamente para sobreviver a múltiplas sessões — inclusive
  depois de um `/clear`, quando o contexto da conversa é perdido mas o
  arquivo continua no disco.
- Aplicabilidade por tipo de Quest é respeitada em duas camadas: cada
  agente já sabe dizer "não se aplica" internamente (o Quartermaster é o
  exemplo — steps 10-11 não fazem sentido para `cli`/`script`), e a
  skill orquestradora também consulta `templates/manifest.json`
  (distribuído a cada Quest como `.claude/quest-manifest.json`, seção 7)
  para nem chegar a invocar um agente que sabe de antemão que não vai
  fazer nada.

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
   as Quests via o comando de CLI `review-proposals` (`bin/cli.js` — ver
   seção 7).
3. Você decide: aceitar (vira regra na Guild, com bump de versão e changelog),
   rejeitar (fica registrado pra não repetir a discussão) ou adiar.
4. Quests existentes não são atualizadas automaticamente — ficam fixas na
   versão da Guild que instalaram, a menos que você rode uma atualização
   manual.

**Princípio:** captura é automática (qualquer agente pode propor), promoção é
sempre humana (evita degradar as Guilds com regras isoladas ou não testadas
em múltiplos contextos).

**Nota:** existe também um `guild-proposals.md` na raiz do próprio
guildhall, distinto do `guild-proposals.md` de cada Quest — acumula
propostas sobre o mecanismo de guilds/CLI em si (não sobre uma Quest
específica). Já tem 3 propostas registradas: uma resolvida (a extensão do
`init`/`update` para distribuir os templates de agente, seção 7), e duas
ainda abertas (a limitação do check de sincronização cruzada, seção 3.2;
e o gate de enforcement do Quartermaster, que hoje é só por instrução, sem
lastro a nível de ferramenta). Conteúdo completo no próprio arquivo, não
repetido aqui.

---

## 7. Distribuição das Guilds — decisão arquitetural

**Modelo escolhido: Guilds como pacote/CLI instalável.**

- As Guilds vivem em um repositório central (`guildhall`, nome
  definitivo — ver nota de nomenclatura na seção 1), publicado como
  pacote (npm ou equivalente, mesmo que só localmente).
- Um CLI expõe comandos como:
  - `init` — copia as Guilds relevantes (core + condicionais conforme tipo de
    Quest) para dentro de um novo projeto **e também** os templates de
    orquestração de agentes (seção 5.1): os subagentes aplicáveis a esse
    tipo de Quest para `.claude/agents/`, a skill orquestradora
    `/quest-flow` (incondicional, para todo tipo de Quest) para
    `.claude/skills/`, e o manifesto de aplicabilidade de agentes, por
    inteiro, para `.claude/quest-manifest.json`.
  - `update` — atualiza uma Quest existente para a versão mais recente das
    Guilds **e** dos templates de agente, cada um checado e re-copiado de
    forma independente.
  - `review-proposals` — consolida propostas (`guild-proposals.md`) de todas
    as Quests conhecidas para revisão humana.
- As Guilds são versionadas (semver), permitindo que uma Quest fique fixada
  numa versão específica mesmo que as Guilds evoluam depois. Os templates de
  agente seguem o mesmo princípio, mas com seu próprio número de versão
  (`templates/manifest.json`), independente do das Guilds — ver "Status"
  abaixo.

**Por que essa escolha:** resolve o problema de sincronizar melhorias entre
múltiplas Quests manualmente, e dá histórico real (changelog) da evolução dos
padrões da fábrica — o que o modelo de "pasta de arquivos" ou "monorepo único"
não oferece de forma nativa.

**Status:** implementado e testado. O CLI (`bin/cli.js`, sem dependências
externas) expõe `init`, `update` e `review-proposals`; o `guildhall init`
já foi validado copiando as 11 guilds do manifesto, os subagentes
aplicáveis ao tipo de Quest (o Quartermaster é filtrado fora de Quests
`cli`/`script`, do mesmo jeito que uma guild condicional que não se
aplica) e a skill `/quest-flow` para um projeto novo. O rastreamento de
versão instalada vive num único `.guildhall-lock.json` na raiz da Quest
(não mais dentro de `guilds/`, já que o arquivo agora cobre mais do que
guilds), com dois campos independentes — `guildhallVersion` para as
Guilds e `agentTemplatesVersion` para os templates de agente — para que
uma mudança de versão em um não force a atualização do outro.

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

- Um arquivo de **tokens** (cores, espaçamento, tipografia, radius e
  sizing — as duas últimas adicionadas como extensão de formato, ver
  `guilds/ux-frontend.md`, "Default token values") como valores
  objetivos — não em prosa — que o lint valida contra hardcoding. Os
  valores default hoje não ficam mais em aberto por Quest: foram
  promovidos a partir de um app real já validado pelo desenvolvedor
  (mesma seção da Guild), com desvio possível mediante justificativa no
  Quest Brief.
- Um arquivo `accessibility.md` com regras de acessibilidade, a maioria
  `automated` via axe-core/Lighthouse CI, algumas `agent-reviewed` (ex:
  experiência real com leitor de tela).

Regras `agent-reviewed` que se mostrarem consistentes ao longo de várias
Quests são candidatas a "amadurecer" para `automated` — isso também pode
virar proposta para o Chronicle (seção 6).

---

## 11. Decisões em aberto

- **Design system para a UX/Frontend Guild** — decisão adiada de propósito.
  Começar apenas pelos tokens (cores, espaçamento, tipografia), automatizáveis
  via lint. Componentes reais (Button, Input, Card...) só devem ser extraídos
  para um design system depois de se repetirem de forma consistente em 2-3
  Quests com UI — mesmo princípio de generalização usado para promover
  propostas ao Chronicle (seção 6). Revisitar após ter Quests reais com
  interface visual.
- **Stack padrão para Quests `cli` e `script`** — gap real (não decisão
  consciente) identificado durante a revisão da Architecture Guild: o
  manifesto lista essas guilds como aplicáveis a todo tipo de Quest, mas
  Architecture, Code Style e outras só definem conteúdo para `web-app`/
  `api`. Só deve ser resolvido quando uma Quest desse tipo for realmente
  tentada, não especulado agora.

---

## 12. Como retomar este projeto em uma nova conversa

Ao iniciar uma nova conversa, anexe este documento e informe em qual seção
das "Decisões em aberto" (seção 11) você quer continuar, ou descreva o próximo
passo desejado. Este documento reflete o estado da especificação até a data
indicada no topo — decisões tomadas em conversas futuras devem ser
incorporadas de volta aqui para manter a continuidade.
