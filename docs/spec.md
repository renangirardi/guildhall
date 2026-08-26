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

**Status atual:** o `guildhall` (repositório central do AetherForge) está
construído e testado — comandos `init`, `update` e `review-proposals`
funcionais, este último agora cobrindo tanto `guild-proposals.md` quanto o
novo `process-gaps.md`, em seções separadas (seção 6). As 11 Guilds
(8 core + 3 condicionais) estão completas, incluindo uma segunda passada de
revisão nas 3 Guilds originais do MVP (Architecture, Security, Code Style),
que nasceram como versões "mini" e foram elevadas ao mesmo padrão de rigor
das demais, e uma rodada de correções pós-retrospectiva da
`calculator-quest` (ver seção 9.1) que levou o `guildhallVersion`
(`guilds/manifest.json`) a `0.1.7` e a versão do próprio CLI
(`package.json`) a `0.2.0`. A orquestração de agentes também está
implementada (sessão de 2026-08-24, quatro fases): os 7 subagentes temáticos,
a skill orquestradora `/quest-flow` e a distribuição de ambos via
`init`/`update` — ver seção 5.1 e seção 7.

O MVP original (calculadora, repositório e deploy na Vercel) foi
desativado — seus aprendizados já estavam capturados na seção 9 antes da
exclusão. **A primeira Quest real com o sistema completo**:
`calculator-quest`, a mesma ideia da calculadora, completou o fluxo inteiro
via `/quest-flow` (Herald → Loremaster → Checkpoint → Artificer → Sentinel
→ Warden → Checkpoint → Quartermaster), incluindo deploy (passo 10) e
monitoramento pós-deploy (passo 11). Um problema de ambiente surgiu durante
a implementação e foi resolvido (hook `commit-msg` do Husky falhando no
GitHub Desktop no Windows por não enxergar o PATH completo — contornado via
commit pelo terminal ou `--no-verify`, com o CI como gate real de qualquer
forma, já que a Ops/Infra Guild nunca tratou o hook local como a garantia
de fato). Uma retrospectiva pós-Quest (2026-08-25) revisou os passos 2, 3,
6, 7, 8, 10 e 11 e resultou em sete correções diretas às Guilds — ver
seção 9.1.

---

## 2. Terminologia (glossário)

| Termo           | Definição                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AetherForge** | Nome definitivo do projeto/metodologia como um todo.                                                                                                          |
| **Guild**       | Conjunto de padrões e decisões reutilizáveis (arquitetura, segurança, estilo de código, etc.) que qualquer Quest deve seguir. Não contém código de aplicação. |
| **Quest**       | Uma aplicação/projeto individual construído a partir dos padrões das Guilds (antes chamado de "Program").                                                     |
| **Quest Brief** | O documento de requisitos de uma Quest (antes chamado de "PRD").                                                                                              |
| **Chronicle**   | Registro de propostas de melhoria a uma Guild (`guild-proposals.md`), geradas durante o desenvolvimento de uma Quest, aguardando revisão humana.              |
| **Process gaps** | Registro (`process-gaps.md`) de achados reais que um agente concluiu não serem seu escopo agir ou propor como regra de Guild agora — mesmo mecanismo de distribuição do Chronicle, mas revisado em separado, sem uma decisão de aceitar/rejeitar regra por trás. Ver seção 6. |
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
  arquivo continua no disco. Também sobrevive a interrupções por limite
  de uso do Claude Code (janela de 5h / limite semanal) pelo mesmo
  motivo: é estado em disco, não em memória de conversa.
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

**`process-gaps.md` — o mecanismo irmão do Chronicle (desde 2026-08-25):**
o Chronicle acima só captura quando um agente conclui *afirmativamente*
que algo generaliza em regra de Guild. Ele nunca cobriu o caso de um
agente identificar algo real, mas concluir que agir ou propor uma regra
de Guild não é seu escopo agora — essa conclusão ficava só implícita
(ou nem isso) em notas de `.quest-progress.json`. `process-gaps.md` fecha
essa lacuna: mesmo mecanismo de distribuição do Chronicle (`init`
escreve uma cópia vazia com cabeçalho/instruções; `update` não o
sobrescreve, já que passa a ser um documento vivo por Quest), mas com um
formato de entrada próprio (o que foi observado, por que não virou
proposta de Guild, sugestão de próximo passo, status) e uma regra
obrigatória na AI/Agents Guild ("Logging a `process-gaps.md` entry")
exigindo que todo agente registre essa conclusão ali. `review-proposals`
mostra os dois arquivos de cada Quest conhecida, em seções separadas —
a natureza da decisão é diferente (não é aceitar/rejeitar uma regra de
Guild). Ainda sem tag de severidade (incidente vs. nota simples) —
deliberadamente em aberto até o mecanismo ter uso real (ver seção 9.1,
item 7).

**Nota:** existe também um `guild-proposals.md` na raiz do próprio
guildhall, distinto do `guild-proposals.md` de cada Quest — acumula
propostas sobre o mecanismo de guilds/CLI em si (não sobre uma Quest
específica). Já tem 3 propostas registradas: uma resolvida (a extensão do
`init`/`update` para distribuir os templates de agente, seção 7), e duas
ainda abertas (a limitação do check de sincronização cruzada, seção 3.2;
e o gate de enforcement do Quartermaster, que hoje é só por instrução, sem
lastro a nível de ferramenta). Conteúdo completo no próprio arquivo, não
repetido aqui.

A `calculator-quest` (seção 1) já tem seu próprio `guild-proposals.md`
com pelo menos um item real: o hook `commit-msg` do Husky falhando no
GitHub Desktop por não enxergar o PATH completo no Windows — candidato a
propor que o `.husky/commit-msg` gerado no scaffold já venha com a
exportação de PATH corrigida por padrão (Code Style Guild).

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
uma mudança de versão em um não force a atualização do outro. Validado
em uso real na `calculator-quest` (seção 1).

Desde 2026-08-25, `init` também escreve uma cópia vazia de
`process-gaps.md` na raiz da Quest, ao lado de `guild-proposals.md`
(mesmo tratamento: `update` não toca em nenhum dos dois, já que ambos
viram documentos vivos por Quest assim que criados) — ver seção 6.
`review-proposals` foi atualizado para imprimir os dois arquivos de cada
Quest escaneada em seções separadas. Essa mudança também é a primeira a
versionar o CLI em si, separadamente das Guilds e dos templates de
agente: `package.json` (`version`) passou de `0.1.0` para `0.2.0`,
enquanto `guildhallVersion` foi a `0.1.7` (a mudança tocou a AI/Agents
Guild) e `agentTemplatesVersion` ficou parado, já que nenhum template de
agente ou skill mudou nesta rodada.

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

MVP original (descontinuado): calculadora com histórico de sessão, do zero ao
deploy na Vercel, usando Claude Code + 3 Guild minis (Architecture, Code Style,
Security). Repositório e deploy excluídos após cumprir seu propósito — os
aprendizados abaixo já estavam capturados antes da exclusão.

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

### 9.1 Retrospectiva da calculator-quest (correções aplicadas às Guilds)

A `calculator-quest` (seção 1) é a primeira Quest a completar o fluxo
inteiro do sistema atual — Herald → Loremaster → Checkpoint → Artificer →
Sentinel → Warden → Checkpoint → Quartermaster (deploy e monitoramento,
passos 10-11) — usando a orquestração de agentes real (seção 5.1) e o
`guildhall` já publicado como CLI (seção 7). Uma retrospectiva pós-Quest
(2026-08-25) revisou os passos 2, 3, 6, 7, 8, 10 e 11 e identificou sete
achados reais, cada um corrigido diretamente na(s) Guild(s)
correspondente(s) no mesmo dia, seguindo a convenção de versionamento e
changelog já estabelecida (seção 7):

1. **Testing/QA Guild (`0.1.0` → `0.1.1`)** — o scaffold de Vitest gerado
   não resolvia o alias de path `@/*` (faltava o plugin
   `vite-tsconfig-paths`) nem chamava `cleanup()` entre testes
   (`@testing-library/react`), quebrando todo teste de componente
   importado via `@/` na primeira execução e vazando estado de DOM entre
   testes no mesmo arquivo. Evidência: passo 7 (Sentinel).
2. **UX/Frontend Guild (`0.1.1` → `0.1.2`)** — o token default `border`
   mede ~1.7:1 de contraste contra `background`, abaixo do piso de 3:1
   que a própria Guild exige para componentes de UI (WCAG 1.4.11).
   Decisão: manter o valor e documentar a limitação em "Default token
   values", já que uma Quest que dependa de `border` como limite visível
   precisa verificar esse par de cores por conta própria. Evidência:
   passo 6 (Artificer).
3. **Product/Ideation + AI/Agents Guild (`0.1.2` → `0.1.3`)** — o `type`
   de uma Quest já é fixado em `.guildhall-lock.json` no `init`, antes do
   Herald sequer ser invocado, mas a Product/Ideation Guild descrevia o
   `type` como decidido do zero a cada vez. Agora tratado como um
   default a confirmar contra a ideia recebida: se bater, o Herald segue;
   se não bater, registra o conflito em "Open questions / assumptions"
   para o Checkpoint do passo 4 resolver, em vez de bloquear. Evidência:
   passo 2 (Herald).
4. **AI/Agents + Architecture Guild (`0.1.3` → `0.1.4`)** — nenhuma Guild
   definia onde o output do Loremaster (design de arquitetura) deveria
   ser salvo; a `calculator-quest` usou `docs/architecture.md` por
   convenção própria, sem ponto de verdade central. A AI/Agents Guild
   ganhou uma nova seção, "Standard agent output locations", mapeando o
   output esperado de cada agente do fluxo (Herald, Loremaster,
   Artificer, Sentinel, Warden, Quartermaster, Scribe) e formalizando
   `docs/architecture.md` para o Loremaster; a Architecture Guild passou
   a referenciar essa seção em vez de deixar o local implícito.
   Evidência: passo 3 (Loremaster).
5. **Ops/Infra Guild (`0.1.4` → `0.1.5`)** — o projeto Vercel foi
   conectado ao repositório antes de código Next.js real existir em
   `main`, fixando o Framework Preset em "Other" silenciosamente; nenhum
   gate de CI detecta esse tipo de falha de configuração de plataforma
   (lint/typecheck/testes passam normalmente, e o deploy falha só na
   própria Vercel). Corrigido com um `vercel.json`
   (`{"framework": "nextjs"}`) padrão no scaffold, e uma verificação
   read-only (`vercel project inspect`) do Quartermaster na primeira
   execução do passo 10 contra uma Quest com código real, para pegar
   projetos que já tinham sido mal-detectados antes dessa correção
   existir. Evidência: passo 10 (Quartermaster).
6. **Monitoring Guild (`0.1.5` → `0.1.6`)** — a Guild já esperava Vercel
   Web Analytics/Speed Insights como item `automated (custom)` do
   scaffold, descrito como "um toggle", mas o scaffold real nunca
   instalava `@vercel/analytics`/`@vercel/speed-insights` nem integrava
   os componentes no layout — corrigido para descrever a instalação e
   integração de código real feita pelo Artificer no scaffold (não uma
   ação manual), com qualquer habilitação manual que a própria Vercel
   eventualmente exija seguindo o mesmo padrão já usado para o
   cadastro do monitor de uptime em "Alerts". Mudança de scaffold para
   Quests futuras, não retroativa. Evidência: passo 11 (Quartermaster).
7. **AI/Agents Guild + CLI (`0.1.6` → `0.1.7`; `package.json` `0.1.0` →
   `0.2.0`)** — o mecanismo existente do Chronicle (`guild-proposals.md`)
   só captura quando um agente conclui afirmativamente que algo
   generaliza em regra de Guild; não cobria o caso de um agente concluir
   que algo é real mas fora do seu escopo agir ou propor uma regra
   agora — essa conclusão ficava só implícita em `.quest-progress.json`.
   Criado `process-gaps.md` (mesmo mecanismo de distribuição do
   `guild-proposals.md`, via `init`), com uma nova regra obrigatória na
   AI/Agents Guild e uma nova seção separada em
   `guildhall review-proposals` — ver seção 6. Sem tag de severidade
   ainda: decisão explicitamente deixada em aberto até o mecanismo ter
   uso real. Evidência: passos 8 (Warden) e 11 (Quartermaster).

`guildhallVersion` atual (`guilds/manifest.json`): `0.1.7`. A versão do
próprio CLI (`package.json`) está em `0.2.0`. `agentTemplatesVersion`
(`templates/manifest.json`) não mudou nesta rodada — nenhuma das sete
correções tocou um template de agente ou skill. Detalhe completo de cada
mudança no changelog de cada Guild (seção final de cada arquivo em
`guilds/`) e no `CHANGELOG.md` da raiz do guildhall.

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
- **Tag de severidade em `process-gaps.md`** — decisão adiada de
  propósito (seção 6, seção 9.1 item 7): se/como distinguir um achado
  no formato de incidente de uma nota de baixo risco dentro de uma
  entrada de `process-gaps.md`. Revisitar depois que o mecanismo tiver
  entradas reais o suficiente para saber se a distinção é necessária,
  não especulado agora com zero entradas reais para validar contra.

---

## 12. Como retomar este projeto em uma nova conversa

Ao iniciar uma nova conversa, anexe este documento e informe em qual seção
das "Decisões em aberto" (seção 11) você quer continuar, ou descreva o próximo
passo desejado. Este documento reflete o estado da especificação até a data
indicada no topo — decisões tomadas em conversas futuras devem ser
incorporadas de volta aqui para manter a continuidade.
