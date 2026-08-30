# AetherForge — Documento de especificação

> Documento de referência para dar continuidade ao projeto em novas conversas.
> Última atualização: 2026-08-30

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
funcionais, este último cobrindo tanto `guild-proposals.md` quanto
`process-gaps.md`, em seções separadas (seção 6). As 11 Guilds (8 core +
3 condicionais) estão completas, incluindo uma segunda passada de revisão
nas 3 Guilds originais do MVP (Architecture, Security, Code Style), que
nasceram como versões "mini" e foram elevadas ao mesmo padrão de rigor
das demais.

A orquestração de agentes passou por **duas rodadas**: a primeira
(sessão de 2026-08-24) implementou um fluxo linear único de 12 passos —
os 7 subagentes temáticos coordenados por uma única skill orquestradora,
`/quest-flow`. A segunda (pós-retrospectiva da `calculator-quest`, ver
seção 9.1 e 9.2, 2026-08-25/26) **substituiu esse fluxo linear por um
modelo de três fases independentes** — `/quest-embark` (fundação da
Quest, uma vez), `/quest-forge <feature>` (uma feature por vez,
repetível) e `/quest-ship` (deploy, repetível/sob demanda) — para dar
controle granular por feature em vez de rodar a Quest inteira de uma
só vez. `/quest-flow` foi **retirado** (diretório removido; git
preserva o histórico). Ver seção 5.1 para o modelo atual e seção 9.2
para a mudança em si.

Essa segunda rodada tocou quatro Guilds (AI/Agents, Product/Ideation,
Architecture, Documentation) e o mecanismo de CLI, levando o
`guildhallVersion` (`guilds/manifest.json`) a `0.1.11`, o
`agentTemplatesVersion` (`templates/manifest.json`) a `0.1.1` e a
versão do próprio CLI (`package.json`) a `0.3.0`. Detalhe completo
em cada Guild afetada, no `CHANGELOG.md` da raiz, e na seção 9.2 abaixo.

Uma terceira mudança, menor e pontual (2026-08-30), respondeu a feedback
de uso real de `/quest-embark`: os agentes dessa fase (sobretudo o
Herald) inferiam demais sozinhos, e o Quest Brief resultante às vezes não
refletia o que o desenvolvedor realmente queria. A correção foi
substituir, só no Modo Visão do Herald, o antigo padrão "infere o que
puder, pergunta só se for ambíguo" por uma rodada fixa de seis perguntas
sempre feita antes do Brief ser escrito — ver seção 9.3. Isso levou o
`guildhallVersion` a `0.1.12` e o `agentTemplatesVersion` a `0.1.2` (o
CLI em si, `package.json`, não mudou nesta rodada).

Uma quarta mudança, no mesmo dia (2026-08-30), respondeu a outro
feedback de uso real: os agentes de cada skill encadeavam seu trabalho
automaticamente, sem parar para revisão — o relatório de um agente já
tinha um próximo agente agindo em cima dele antes de haver tempo real de
ler o relatório com calma, principalmente em conversas longas. A
correção foi generalizar o conceito de Checkpoint: agora **todo agente
nomeado, nas três skills, para para aprovação humana explícita
imediatamente depois de terminar seu trabalho** — sem exceção, inclusive
no ciclo de correção do Warden dentro de `/quest-forge` e no último
agente de cada skill — ver seção 9.4. Isso tocou a AI/Agents Guild (o
schema do `.quest-progress.json` ganhou rastreamento por agente) e as
três skills (`quest-embark`, `quest-forge`, `quest-ship`), levando o
`guildhallVersion` a `0.1.13` e o `agentTemplatesVersion` a `0.1.3` (o
CLI em si, `package.json`, não mudou nesta rodada).

Uma quinta mudança, ainda no mesmo dia (2026-08-30), fechou uma lacuna
diferente: nada no sistema tratava uma Quest que depende de **outra**
aplicação ainda não construída (o caso canônico é um frontend que
precisa de um backend que ninguém fez ainda, mas o mecanismo é o mesmo
pra qualquer direção — API dependendo de outra API, CLI dependendo de
um serviço). A correção deu ao Loremaster uma nova decisão de
arquitetura — estratégia de mock (fixtures estáticas em `mocks/` por
padrão, não uma biblioteca de interceptação de rede) — e introduziu
`docs/integration-contract.md`, escrito incrementalmente (esqueleto no
`/quest-embark`, uma entrada por operação a cada `/quest-forge` que
toca a dependência) e formatado de propósito pra servir quase como
"ideia" pronta pra um `/quest-embark` futuro da dependência em si — ver
seção 9.5. Tocou a Architecture Guild (a regra em si), a AI/Agents Guild
(novas linhas na tabela de output locations), o Product/Ideation Guild
(o intake do Herald passou a perguntar sobre isso) e a Documentation
Guild (o README aponta pro contrato quando aplicável). Nenhuma skill ou
template de agente mudou — Loremaster e Artificer já leem a Guild
inteira antes de agir, mesmo padrão de "Persistence decisions". Isso
levou o `guildhallVersion` a **`0.1.14`** (`agentTemplatesVersion` e
`package.json` não mudaram nesta rodada). **Esses são os números
vigentes hoje.**

O MVP original (calculadora, repositório e deploy na Vercel) foi
desativado — seus aprendizados já estavam capturados na seção 9 antes da
exclusão. **A primeira Quest real com o sistema completo**:
`calculator-quest`, a mesma ideia da calculadora, completou o fluxo
inteiro *sob o modelo linear original* via `/quest-flow` (Herald →
Loremaster → Checkpoint → Artificer → Sentinel → Warden → Checkpoint →
Quartermaster), incluindo deploy (passo 10) e monitoramento pós-deploy
(passo 11) — `/quest-flow` ainda existia quando essa Quest rodou; a
retirada dele veio depois, na segunda rodada acima. Um problema de
ambiente surgiu durante a implementação e foi resolvido (hook
`commit-msg` do Husky falhando no GitHub Desktop no Windows por não
enxergar o PATH completo — contornado via commit pelo terminal ou
`--no-verify`, com o CI como gate real de qualquer forma, já que a
Ops/Infra Guild nunca tratou o hook local como a garantia de fato). Uma
retrospectiva pós-Quest (2026-08-25) revisou os passos 2, 3, 6, 7, 8, 10
e 11 desse fluxo linear e resultou em sete correções diretas às Guilds
(seção 9.1), seguidas pela reestruturação em três fases descrita acima
(seção 9.2).

---

## 2. Terminologia (glossário)

| Termo           | Definição                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AetherForge** | Nome definitivo do projeto/metodologia como um todo.                                                                                                          |
| **Guild**       | Conjunto de padrões e decisões reutilizáveis (arquitetura, segurança, estilo de código, etc.) que qualquer Quest deve seguir. Não contém código de aplicação. |
| **Quest**       | Uma aplicação/projeto individual construído a partir dos padrões das Guilds (antes chamado de "Program").                                                     |
| **Quest Brief** | O documento de visão de uma Quest, produzido por `/quest-embark` (antes chamado de "PRD"). Desde a reestruturação em três fases (seção 9.2), é **propositalmente incompleto**: cobre visão geral, `type` e critérios de sucesso gerais, não o detalhe feature a feature — ver "Feature Brief" abaixo e a Product/Ideation Guild, "Herald's two modes".                                                                                              |
| **Feature backlog** | `docs/feature-backlog.md`, produzido junto com o Quest Brief por `/quest-embark`. Lista solta de features candidatas, uma a duas frases cada, com status `planned` / `in-progress` / `done`. Ver Product/Ideation Guild, "Feature backlog format".            |
| **Feature Brief** | O documento de requisitos detalhado de **uma única feature** — critérios de aceite, escopo, casos de borda — produzido por `/quest-forge <feature>` em `docs/features/<slug>.md`. Não existe antes da primeira execução de `/quest-forge` daquela feature. Ver Product/Ideation Guild, "Feature Brief format".            |
| **Chronicle**   | Registro de propostas de melhoria a uma Guild (`guild-proposals.md`), geradas durante o desenvolvimento de uma Quest, aguardando revisão humana.              |
| **Process gaps** | Registro (`process-gaps.md`) de achados reais que um agente concluiu não serem seu escopo agir ou propor como regra de Guild agora — mesmo mecanismo de distribuição do Chronicle, mas revisado em separado, sem uma decisão de aceitar/rejeitar regra por trás. Ver seção 6. |
| **Guildhall**   | O repositório central específico dentro do AetherForge, onde as Guilds e os templates de orquestração de agentes vivem, empacotado como CLI instalável.       |
| **Checkpoint**  | Gate humano de revisão dentro do fluxo de desenvolvimento. Desde a introdução dos Checkpoints por agente (seção 9.4, 2026-08-30), acontece depois de **todo agente nomeado**, nas três skills, sem exceção — inclusive a cada passagem pelo ciclo de correção do Warden dentro de `/quest-forge`, e no último agente de cada skill (nesse caso, a fase/feature/deploy só vira `done` depois do Checkpoint aprovado, não assim que o agente termina de rodar). Um tipo à parte, mais antigo, é o Checkpoint de **escopo** do `/quest-ship` (existia desde a seção 9.2): revisa e decide o que entra no deploy *antes* de qualquer agente agir, diferente dos Checkpoints "por agente" (que revisam o que um agente já terminou). Nunca inferido do silêncio ou do desenvolvedor mudar de assunto.                                                                                     |

**Nomes temáticos dos agentes (definitivos):**

| Papel técnico | Nome temático     | Skill(s) onde atua |
| ------------- | ----------------- | ----------------- |
| Product       | **Herald**        | `/quest-embark` (Modo Visão) + `/quest-forge` (Modo Feature Brief) |
| Architect     | **Loremaster**    | `/quest-embark` |
| Builder       | **Artificer**     | `/quest-embark` (scaffold) + `/quest-forge` (implementação) |
| QA            | **Sentinel**      | `/quest-forge` |
| Reviewer      | **Warden**        | `/quest-forge` |
| Ops           | **Quartermaster** | `/quest-ship` |
| Docs          | **Scribe**        | `/quest-ship` (atualização incremental) |

Esses nomes temáticos são também os nomes reais dos arquivos de subagente
do Claude Code em `templates/claude/agents/` (`herald.md`,
`loremaster.md`, `artificer.md`, `sentinel.md`, `warden.md`,
`quartermaster.md`, `scribe.md`) — ver seção 5.1 para como eles são
coordenados. **Gap conhecido, ainda não fechado**: esses sete arquivos
de template ainda descrevem a si mesmos em termos do fluxo linear
antigo ("step 2", "step-4 Checkpoint" etc.) — não foram reescritos para
o modelo de três fases. As três skills novas contornam isso explicando
o modo/contexto correto a cada subagente no momento da delegação (ver
cada `SKILL.md`, seção "Known gap"), e cada uma delas nomeia
explicitamente a atualização desses sete templates como candidata a
`guild-proposals.md` do guildhall — ainda **não registrada** lá até esta
atualização do spec; fica como próximo passo a executar, não uma
correção já feita.

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

**Superado pela reestruturação em três fases (seção 9.2, 2026-08-25/26).**
Até essa mudança, o fluxo era uma sequência linear única de 12 passos,
coordenada por uma skill só (`/quest-flow`, hoje retirada). Hoje é isto:

| Fase                                | Skill                    | Cardinalidade                 |
| ------------------------------------ | ------------------------ | ------------------------------ |
| Fundação da Quest                    | `/quest-embark`          | Uma vez por Quest              |
| Detalhar + construir uma feature     | `/quest-forge <feature>` | Repetível, uma vez por feature |
| Publicar                             | `/quest-ship`            | Repetível, sob demanda         |

**`/quest-embark`** — roda uma vez. Sequência interna:

| Etapa                                                      | Executor                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Ideação — ideia solta em 2-3 frases                        | Você                                                              |
| Intake — bateria fixa de 6 perguntas (seção 9.3)            | Você responde, **Herald** pergunta                                |
| Quest Brief (Modo Visão) + `docs/feature-backlog.md`       | **Herald** (consulta Product/Ideation Guild)                      |
| **Checkpoint (Herald)**                                     | Você                                                              |
| Design de arquitetura, favorecendo extensibilidade         | **Loremaster** (consulta Architecture + Data Guild)               |
| **Checkpoint (Loremaster)**                                  | Você                                                              |
| Scaffold da Quest (estrutura, configs, CI/CD base)         | **Artificer** (consulta Code Style, Ops/Infra, Security Guild)    |
| **Checkpoint (Artificer)**                                   | Você                                                              |

Ao final, o Quest Brief é **propositalmente incompleto** — cobre visão,
`type` e critérios de sucesso gerais, não o detalhe feature a feature
(esse detalhe fica para `/quest-forge`) — e o backlog é uma lista solta,
não uma especificação. `foundation.status` só vira `done` depois do
terceiro Checkpoint (Artificer) aprovado — não quando os três agentes já
rodaram (seção 9.4). Se o intake do Herald indicar que essa Quest
depende de outra aplicação ainda não construída, o Loremaster também
decide a estratégia de mock e cria o esqueleto de
`docs/integration-contract.md` nesta mesma fase (Architecture Guild,
"External dependencies — mocking and the integration contract"; seção
9.5) — não todo `/quest-embark` produz esses dois artefatos, só quando
essa dependência existe de fato.

**`/quest-forge <feature>`** — repetível, uma feature por execução, tantas
vezes quanto o backlog (ou o desenvolvedor) precisar:

| Etapa                                                      | Executor                                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Feature Brief completo só daquela feature                 | **Herald**, Modo Feature Brief (consulta Product/Ideation Guild)                  |
| **Checkpoint (Herald)**                                      | Você                                                                               |
| Implementação da feature                                   | **Artificer**                                                                      |
| **Checkpoint (Artificer)**                                   | Você                                                                               |
| Geração de testes da feature                                | **Sentinel** (consulta Testing/QA Guild)                                          |
| **Checkpoint (Sentinel)**                                    | Você                                                                               |
| Revisão de código da feature                                | **Warden** (checklist de Security + Code Style, incluindo verificação de idioma)  |
| **Checkpoint (Warden)**                                      | Você                                                                               |

Desde a seção 9.4, `/quest-forge` ganhou Checkpoint depois de **cada** um
desses quatro agentes — inclusive a cada passagem pelo ciclo de correção
quando o Warden reprova algo (Artificer conserta → Checkpoint → Sentinel
testa de novo → Checkpoint → Warden revisa de novo → Checkpoint). Antes
dessa mudança não existia Checkpoint humano nenhum dentro de
`/quest-forge`; a revisão de Warden sozinha era o gate da fase. Se essa
Quest depende de outra aplicação ainda não construída (seção 9.5),
Artificer também atualiza `mocks/` e `docs/integration-contract.md`
sempre que a feature em questão precisar de algo novo da dependência —
o Warden confere que os dois foram atualizados juntos, como parte da
mesma revisão.

**`/quest-ship`** — repetível, sob demanda, publica o que estiver pronto
até aquele momento (não espera o backlog inteiro ficar `done`):

| Etapa                                                                        | Executor                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| **Checkpoint (escopo)** — revisão das features `done` ainda não publicadas em nenhum deploy anterior | Você                    |
| Deploy                                                                        | **Quartermaster** (consulta Ops/Infra Guild)          |
| Monitoramento pós-deploy                                                       | **Quartermaster** (consulta Monitoring Guild)         |
| **Checkpoint (Quartermaster)**                                                | Você                                                    |
| Atualização **incremental** de documentação, só das features desse deploy    | **Scribe** (consulta Documentation Guild)             |
| **Checkpoint (Scribe)**                                                       | Você                                                    |

O Checkpoint de escopo, no início, já existia desde a seção 9.2 e não
muda — decide o que entra no deploy antes de qualquer agente agir. Os
dois novos (seção 9.4) revisam o que Quartermaster e Scribe entregaram,
cada um depois do seu próprio passo.

**Registro de propostas de melhoria às Guilds (Chronicle)** — não é uma
etapa de nenhuma das três skills; qualquer agente, em qualquer uma
delas, pode registrar uma proposta a qualquer momento (seção 6).

**Regra de divisão de implementação (dentro de `/quest-forge`):** separar
por camada, não por feature — primeiro lógica pura (`/lib`), depois UI
consumindo essa lógica. Facilita revisão e testes. Continua valendo
igual sob o novo modelo — a única mudança é que essa divisão agora
acontece dentro do escopo de uma feature por vez, não da Quest inteira.

### 5.1 Orquestração dos agentes — modelo de três fases

Substitui a decisão original de 2026-08-24 (fluxo linear único,
`/quest-flow`) pela reestruturação pós-retrospectiva descrita em 9.2.
Princípio inalterado: **automação máxima possível** dentro de cada fase,
mantendo intervenção humana exatamente nos pontos de Checkpoint e em
qualquer ação que a AI/Agents Guild já classifica como
`agent-recommended, human-confirmed` (seção 10) — nenhum ponto de parada
adicional foi inventado além desses.

- Cada papel temático da seção 2 continua sendo um subagente real do
  Claude Code, um arquivo por papel, em `templates/claude/agents/` —
  Herald, Loremaster, Artificer, Sentinel, Warden, Quartermaster, Scribe.
  Esses sete arquivos ainda descrevem a si mesmos em termos do fluxo
  linear antigo (gap conhecido — ver seção 2, nota sob a tabela de
  nomes temáticos).
- Os sete não são mais coordenados por uma única skill: são três skills
  independentes, cada uma no seu próprio diretório em
  `templates/claude/skills/` — `quest-embark/`, `quest-forge/`,
  `quest-ship/` (a antiga `quest-flow/` foi removida). O nome do
  comando vem do nome do diretório da skill no Claude Code, não do
  campo `name:` do seu frontmatter — por isso `/quest-embark`, não
  `/embark`.
- Um Checkpoint continua sem ser nenhum mecanismo especial de pausa — é
  só a skill apresentando o resultado do passo anterior e terminando o
  turno; a retomada acontece porque o desenvolvedor manda uma nova
  mensagem, na mesma sessão ou em uma futura. **Desde a seção 9.4
  (2026-08-30), onde ele acontece mudou de novo**: não são mais só dois
  *tipos* de ponto (fim de `/quest-embark`, cada `/quest-ship`) — agora é
  depois de **todo agente nomeado**, nas três skills, sem exceção
  (Product/Ideation Guild, "Vision Mode intake", é o único tipo de pausa
  que não é um Checkpoint — pergunta *antes* do Herald trabalhar, não
  aprova o que ele já entregou).
- Progresso é persistido em `.quest-progress.json`, na raiz da própria
  Quest, com um schema de três seções (AI/Agents Guild,
  "`.quest-progress.json` — schema for the three-phase model"), cada uma
  agora também com um objeto `steps` rastreando `status`/`checkpoint`
  por agente individualmente (seção 9.4):
  - `foundation` — preenchida uma vez, por `/quest-embark`; só vira
    `done` quando os três agentes (`herald`, `loremaster`, `artificer`)
    estão com Checkpoint aprovado.
  - `features` — array, cresce uma entrada por execução de
    `/quest-forge`; cada entrada só vira `done` quando os quatro agentes
    (`herald`, `artificer`, `sentinel`, `warden`) estão com Checkpoint
    aprovado — uma passagem pelo ciclo de correção do Warden reseta
    `artificer`/`sentinel`/`warden` de volta a `pending`, sem acumular
    histórico de tentativas.
  - `deploys` — array, cresce uma entrada por execução de
    `/quest-ship`, cada entrada registrando quais features (por
    `slug`) entraram naquele deploy específico (`featuresIncluded`) e
    carregando tanto o Checkpoint de escopo (campo `checkpoint`, no
    nível da entrada) quanto os `steps` de `quartermaster`/`scribe`.
  Continua sobrevivendo a múltiplas sessões — inclusive depois de um
  `/clear` ou de interrupções por limite de uso do Claude Code (janela
  de 5h / limite semanal) — pelo mesmo motivo de sempre: é estado em
  disco, não em memória de conversa.
- Aplicabilidade por tipo de Quest continua respeitada em duas camadas:
  cada agente já sabe dizer "não se aplica" internamente (o
  Quartermaster é o exemplo — não deploya/monitora nada para
  `cli`/`script`), e cada skill orquestradora também consulta
  `templates/manifest.json` (distribuído a cada Quest como
  `.claude/quest-manifest.json`, seção 7) antes de invocar um agente
  que sabe de antemão que não vai fazer nada.
- **Quatro Guilds foram atualizadas para sustentar esse modelo** —
  AI/Agents (o modelo em si, seção "Orchestration model — three
  Quest-phase skills"), Product/Ideation ("Herald's two modes: Vision
  Mode and Feature Brief Mode"), Architecture ("Extensibility over
  premature optimization at `/quest-embark`") e Documentation
  ("Incremental updates — Scribe's cadence at `/quest-ship`"). Ver
  seção 9.2 para o detalhe de cada bump de versão.

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
específica). Tem 4 propostas registradas: uma resolvida (a extensão do
`init`/`update` para distribuir os templates de agente, seção 7), e três
ainda abertas (a limitação do check de sincronização cruzada quanto a
referências ao próprio `docs/spec.md`; o mesmo check não exigir uma
referência de volta positiva, só o arquivo ter sido tocado — seção 3.2;
e o gate de enforcement do Quartermaster, que hoje é só por instrução,
sem lastro a nível de ferramenta). A atualização dos sete templates de
agente para o modelo de três fases (seção 5.1, "gap conhecido") ainda
**não** está entre elas — continua só citada dentro de cada `SKILL.md`
novo, não formalizada como entrada aqui. Conteúdo completo no próprio
arquivo, não repetido aqui.

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
    tipo de Quest para `.claude/agents/`, as três skills de fase
    (`quest-embark`, `quest-forge`, `quest-ship` — incondicionais, para
    todo tipo de Quest, copiadas como diretórios inteiros de
    `templates/claude/skills/` sem nenhum nome de skill hardcoded no
    CLI) para `.claude/skills/`, e o manifesto de aplicabilidade de
    agentes, por inteiro, para `.claude/quest-manifest.json`. Também
    escreve os scaffolds vivos-por-Quest: `guild-proposals.md`,
    `process-gaps.md`, `docs/feature-backlog.md` e `docs/features/`
    (com um `README.md` explicando o propósito da pasta) — todos
    escritos uma vez, nunca sobrescritos por `update`.
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
aplica) e as três skills de fase para um projeto novo. O rastreamento de
versão instalada vive num único `.guildhall-lock.json` na raiz da Quest
(não mais dentro de `guilds/`, já que o arquivo agora cobre mais do que
guilds), com dois campos independentes — `guildhallVersion` para as
Guilds e `agentTemplatesVersion` para os templates de agente — para que
uma mudança de versão em um não force a atualização do outro. Validado
em uso real na `calculator-quest` (seção 1, sob o modelo linear antigo)
e, mais recentemente, com um `init` + `update` de teste (pasta
temporária) confirmando que as três skills novas se instalam
corretamente e que `docs/feature-backlog.md` sobrevive a um `update`
sem ser sobrescrito.

Desde 2026-08-25, `init` também escreve uma cópia vazia de
`process-gaps.md` na raiz da Quest, ao lado de `guild-proposals.md`
(mesmo tratamento: `update` não toca em nenhum dos dois, já que ambos
viram documentos vivos por Quest assim que criados) — ver seção 6.
`review-proposals` foi atualizado para imprimir os dois arquivos de cada
Quest escaneada em seções separadas. Essa mudança também foi a primeira a
versionar o CLI em si, separadamente das Guilds e dos templates de
agente: `package.json` (`version`) passou de `0.1.0` para `0.2.0`,
enquanto `guildhallVersion` foi a `0.1.7` (a mudança tocou a AI/Agents
Guild) e `agentTemplatesVersion` ficou parado, já que nenhum template de
agente ou skill mudou nesta rodada.

**Atualização mais recente (2026-08-26, parte da reestruturação em três
fases — seção 9.2):** `cmdInit` passou a escrever também
`docs/feature-backlog.md` e `docs/features/README.md`, mesmo padrão de
distribuição de `guild-proposals.md`/`process-gaps.md`. O comentário
que descrevia `/quest-flow` como "a skill orquestradora, copiada
incondicionalmente" foi substituído por um descrevendo as três skills
novas — a lógica de cópia em si (`copyDirRecursive` sobre
`templates/claude/skills/`) não precisou mudar, já que nunca teve o
nome `quest-flow` hardcoded, apenas copia o que existir no diretório.
`agentTemplatesVersion` foi de `0.1.0` a `0.1.1` (o conjunto de skills
mudou) e `package.json` foi de `0.2.0` a `0.3.0` (o mecanismo do CLI
mudou); `guildhallVersion` não foi tocado por essa entrada específica —
os bumps das quatro Guilds (seção 9.2) já o levaram a `0.1.11` em
commits anteriores. Ver o `CHANGELOG.md` da raiz, entrada
`[agentTemplatesVersion 0.1.1 / cli 0.3.0]`.

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
inteiro do sistema *da época* — Herald → Loremaster → Checkpoint →
Artificer → Sentinel → Warden → Checkpoint → Quartermaster (deploy e
monitoramento, passos 10-11), o fluxo linear único via `/quest-flow`,
não o modelo de três fases que a seção 5.1 descreve hoje — usando a
orquestração de agentes real então vigente e o `guildhall` já publicado
como CLI (seção 7). Uma retrospectiva pós-Quest
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

Ao final dessas sete correções (2026-08-25, antes da reestruturação em
três fases abaixo): `guildhallVersion` (`guilds/manifest.json`) em
`0.1.7`, CLI (`package.json`) em `0.2.0`, `agentTemplatesVersion`
(`templates/manifest.json`) parado — nenhuma das sete correções tocou um
template de agente ou skill. Detalhe completo de cada mudança no
changelog de cada Guild (seção final de cada arquivo em `guilds/`) e no
`CHANGELOG.md` da raiz do guildhall. **Esses números não são mais os
atuais** — ver 9.2 abaixo para o que mudou em seguida, e a seção 1 para
os números vigentes hoje.

### 9.2 Pós-retrospectiva: reestruturação em três fases (2026-08-25/26)

As sete correções da seção 9.1 consertaram regras específicas dentro do
fluxo linear de 12 passos, mas não mudaram a forma desse fluxo. Um
problema estrutural diferente motivou uma mudança maior: `/quest-flow`
só sabia rodar a Quest inteira, do zero ao deploy, numa sequência única
— não havia como o desenvolvedor pedir "só essa feature nova" sem
reinvocar (ou reinterpretar manualmente) o fluxo inteiro. Decisão:
substituir o fluxo linear por **três skills independentes e invocáveis
separadamente**, dando controle granular por feature em vez de rodar a
aplicação inteira de uma vez. Evidência usada em todo commit desta
rodada: "process change following calculator-quest retrospective,
2026-08-25".

**O que mudou:**

- **`/quest-embark`** substitui os passos 1-5 do fluxo antigo (Ideação,
  Quest Brief, Arquitetura, Checkpoint, Scaffold). Roda uma vez por
  Quest. Produz uma Visão do app — um Quest Brief deliberadamente
  incompleto — mais `docs/feature-backlog.md` (backlog solto de
  features candidatas) e o scaffold já rodado.
- **`/quest-forge <feature>`** substitui os passos 6-8 (Implementação,
  Testes, Revisão), aplicados a uma feature por vez, repetível. Herald
  escreve um Feature Brief detalhado só daquela feature em
  `docs/features/<slug>.md` (não existia antes desse momento), Artificer
  implementa, Sentinel testa, Warden revisa. Termina o turno apresentando
  o resultado — sem Checkpoint humano aqui.
- **`/quest-ship`** substitui os passos 9-12 (Checkpoint pré-deploy,
  Deploy, Monitoramento, Docs). Repetível/sob demanda — não espera o
  backlog inteiro estar `done`; publica o que estiver pronto até aquele
  momento. Cada execução roda o Checkpoint revisando tudo que foi
  construído desde o último deploy, publica, monitora, e Scribe faz uma
  atualização **incremental** de documentação — nunca mais uma
  "documentação final" única.
- **`/quest-flow` foi retirado** — diretório
  `templates/claude/skills/quest-flow/` removido (não deixado como
  stub, seguindo o mesmo precedente do MVP original: aprendizados
  capturados antes da exclusão, sem artefato morto deixado para trás).
  Git preserva o histórico se precisar consultar.

**Guilds atualizadas (uma por vez, cada uma com seu próprio bump e
changelog — ver o changelog de cada arquivo em `guilds/` e o
`CHANGELOG.md` da raiz):**

1. **AI/Agents Guild (`0.1.7` → `0.1.8`)** — nova seção "Orchestration
   model — three Quest-phase skills" descrevendo as três skills, a
   regra de que o Checkpoint humano agora acontece em dois *tipos* de
   ponto (fim de `/quest-embark`; toda vez que `/quest-ship` roda, pode
   repetir várias vezes) em vez de dois passos fixos, e o novo schema de
   `.quest-progress.json` (`foundation` / `features` / `deploys`, com
   exemplo). "Agent roles and decision authority" e "Standard agent
   output locations" remapeados das skills antigas para as novas
   (incluindo `docs/feature-backlog.md` e `docs/features/<slug>.md`
   como outputs padrão do Herald).
2. **Product/Ideation Guild (`0.1.8` → `0.1.9`)** — nova seção
   "Herald's two modes: Vision Mode and Feature Brief Mode" distinguindo
   os dois modos de trabalho do Herald; novas regras "Feature backlog
   format" e "Feature Brief format"; confirmado explicitamente que a
   regra de `type` como default a confirmar (item 3 da retrospectiva
   9.1) não muda — continua resolvida uma única vez, dentro de
   `/quest-embark`.
3. **Architecture Guild (`0.1.9` → `0.1.10`)** — nova regra
   "Extensibility over premature optimization at `/quest-embark`":
   decisões de arquitetura tomadas antes de qualquer feature ter
   especificação completa devem favorecer extensibilidade (modelos de
   dados sem conjunto fechado de casos de uso, evitar acoplamentos
   rígidos que só servem à primeira feature implementada) e sinalizar em
   `docs/architecture.md` quando uma decisão pode precisar de revisão
   mais tarde.
4. **Documentation Guild (`0.1.10` → `0.1.11`)** — nova regra
   "Incremental updates — Scribe's cadence at `/quest-ship`": cada
   execução de `/quest-ship` revisa o README (e outros docs) só à luz
   das features daquele deploy específico (`.quest-progress.json`,
   `deploys[].featuresIncluded`), atualizando em vez de reescrever do
   zero. "README format" em si não mudou — só a cadência.

**CLI e templates de agente:**

- Três skills novas criadas em `templates/claude/skills/` —
  `quest-embark/`, `quest-forge/`, `quest-ship/` — cada uma citando as
  Guilds acima em vez de duplicar o conteúdo delas. Cada `SKILL.md`
  documenta explicitamente um gap conhecido: os sete templates de
  subagente (`.claude/agents/*.md`) ainda descrevem a si mesmos em
  termos do fluxo linear antigo e não foram reescritos para o modelo de
  três fases — as skills contornam isso explicando o modo/contexto
  correto a cada subagente no momento da delegação. Fica como próximo
  passo, ainda não registrado em `guild-proposals.md` (seção 6).
- `bin/cli.js`: `cmdInit`/`cmdUpdate` continuam copiando
  `templates/claude/skills/` inteiro (a lógica nunca teve `quest-flow`
  hardcoded); `cmdInit` passou a também escrever
  `docs/feature-backlog.md` e `docs/features/README.md`, mesmo padrão
  de `guild-proposals.md`/`process-gaps.md`. Validado com um `init` +
  `update` de teste (seção 7).
- `templates/manifest.json` (`agentTemplatesVersion`): `0.1.0` →
  `0.1.1`.
- `package.json` (CLI): `0.2.0` → `0.3.0`.
- `guildhallVersion` (`guilds/manifest.json`), após as quatro Guilds
  acima: **`0.1.11`**.

Ver `CHANGELOG.md` da raiz para as entradas completas (`[0.1.8]` a
`[0.1.11]`, e `[agentTemplatesVersion 0.1.1 / cli 0.3.0]`).

### 9.3 Rodada fixa de perguntas no Modo Visão do Herald (2026-08-30)

Feedback de uso real do `/quest-embark` (não uma retrospectiva pós-Quest
como 9.1/9.2, mas o mesmo tipo de correção de processo): os agentes
dessa fase — sobretudo o Herald — decidiam demais por conta própria, e o
Quest Brief resultante às vezes não refletia o que o desenvolvedor
queria de fato. A causa raiz identificada foi a própria regra do
Product/Ideation Guild então vigente para o Modo Visão ("Herald's
authority"): inferir tudo que a ideia não resolvesse explicitamente, e
perguntar só quando algo fosse genuinamente ambíguo — "one question, not
an intake form".

**Decisão**: substituir esse default, **só no Modo Visão**, por uma
rodada fixa de seis perguntas que o Herald sempre faz antes de escrever
`docs/quest-brief.md`, independente de quão completa a ideia original
pareça:

1. **Problema e público** — quem usa isso e que dor resolve.
2. **Tipo confirmado** — `web-app | api | cli | script`, e se
   `web-app`/`api`: single-user ou multi-user.
3. **Limites do v1** — o que é essencial na primeira versão vs. o que
   fica pra depois de propósito.
4. **Critério de sucesso** — como saber que a Quest está funcionando, de
   um jeito verificável.
5. **Restrições conhecidas** — preferência técnica, integração
   obrigatória, ambiente de execução específico.
6. **Não-objetivos explícitos** — algo que o desenvolvedor ativamente
   não quer que a Quest faça, distinto de algo simplesmente deixado fora
   do v1.

Perguntadas sempre juntas, numa lista curta numerada, numa única
mensagem — não um formulário de intake extenso, nem uma pergunta por
vez. O **Modo Feature Brief** (`/quest-forge <feature>`) não muda: continua
com o modelo antigo, uma pergunta só quando a feature é ambígua — uma
feature individual é uma decisão bem menor que a forma da Quest inteira,
e uma rodada de seis perguntas seria desproporcional para um pedido de
uma frase. O **Loremaster** também não muda — continua aplicando os
defaults da Architecture/Data Guild e só sinalizando desvio no
Checkpoint, em vez de ter sua própria rodada de perguntas (decisão
consciente de escopo, avaliada e descartada nesta mesma rodada de
mudança — ver seção 5.1 se isso for revisitado no futuro).

**O que mudou:**

- **Product/Ideation Guild (`0.1.9` → `0.1.10`)** — nova regra "Vision
  Mode intake — a fixed round of questions before drafting"; "Herald's
  authority: what it infers versus what it asks" reescrita para
  restringir seu modelo de pergunta-só-se-ambíguo ao Modo Feature Brief;
  "`type` as a default to confirm" e "When an idea (or a feature) is too
  vague to become a brief yet" atualizadas para referenciar a nova
  rodada no Modo Visão.
- **`templates/claude/skills/quest-embark/SKILL.md`
  (`agentTemplatesVersion` `0.1.1` → `0.1.2`)** — o briefing de
  delegação ao Herald passou a instruir explicitamente a rodada de
  intake e a esperar a resposta do desenvolvedor antes de qualquer
  rascunho, usando o mesmo padrão que essa skill já usa para contornar o
  `herald.md` ainda não estar reescrito para o modelo de três fases
  (seção 2, "gap conhecido") — o texto do próprio `herald.md` ainda diz
  "never a full intake form", frase que descrevia exatamente o default
  antigo que essa mudança substitui; o briefing de delegação da skill é
  o que sobrepõe essa linha desatualizada até o template em si ser
  reescrito. "How the Checkpoint actually pauses" e "Resuming" também
  foram atualizadas para tratar essa nova espera (perguntar e terminar o
  turno) com o mesmo mecanismo já usado no Checkpoint — sem inventar
  nenhum mecanismo de pausa novo.
- `guildhallVersion` (`guilds/manifest.json`): `0.1.11` → **`0.1.12`**.
- `agentTemplatesVersion` (`templates/manifest.json`): `0.1.1` →
  **`0.1.2`**.
- `package.json` (CLI): não mudou nesta rodada — nenhuma mudança no
  mecanismo do CLI em si.

Ver `CHANGELOG.md` da raiz, entrada `[0.1.12]`, para o detalhe completo.

### 9.4 Checkpoint depois de todo agente, nas três skills (2026-08-30)

Feedback de uso real, no mesmo dia da seção 9.3: os agentes de cada
skill encadeavam seu trabalho automaticamente — o relatório de um
agente já tinha um próximo agente agindo em cima dele antes de haver
tempo real de revisar com calma, especialmente numa conversa longa, onde
o relatório acabava "perdido" no meio do histórico. Antes dessa mudança,
só existiam dois Checkpoints no sistema inteiro: o combinado
Brief+arquitetura ao final de Herald+Loremaster (`/quest-embark`) e o de
escopo pré-deploy (`/quest-ship`) — nenhum dentro de `/quest-forge`.

**Decisão**: generalizar o conceito de Checkpoint. Agora, sempre que
**qualquer agente nomeado** (Herald, Loremaster, Artificer, Sentinel,
Warden, Quartermaster, Scribe) termina seu trabalho e produz seu
relatório, em **qualquer uma das três skills**, a skill apresenta esse
relatório e termina o turno — sem encadear automaticamente pro próximo
agente e sem avançar o `status` da fase/feature/deploy — até o
desenvolvedor aprovar explicitamente na próxima mensagem. Sem exceções:

- **Toda passagem de bastão entre agentes**, nas três skills — inclusive
  Herald → Loremaster e Loremaster → Artificer em `/quest-embark`, que
  antes rodavam direto até o Checkpoint combinado; e todos os quatro
  agentes de `/quest-forge`, que antes não tinham Checkpoint nenhum.
- **O ciclo de correção do Warden dentro de `/quest-forge`**: quando o
  Warden reprova algo, o ciclo Artificer (conserta) → Sentinel (testa de
  novo) → Warden (revisa de novo) ganha Checkpoint depois de cada um
  desses passos também — não roda mais sozinho até voltar limpo.
- **O último agente de cada skill** (Artificer no `/quest-embark`,
  Warden no `/quest-forge`, Scribe no `/quest-ship`) também ganha
  Checkpoint próprio — a fase/feature/deploy só vira `done` quando esse
  Checkpoint final é aprovado, não assim que o agente termina de rodar.

O Checkpoint de escopo do `/quest-ship` (revisão pré-deploy do que vai
ser publicado) **não muda** — continua decidindo o que entra no deploy
antes de qualquer agente agir, e passa a conviver com dois Checkpoints
novos, um depois do Quartermaster e outro depois do Scribe. O Checkpoint
combinado "Brief + arquitetura" de `/quest-embark` é **retirado**, não
empilhado por baixo dessa regra — vira dois Checkpoints separados, um
depois do Herald e outro depois do Loremaster. A rodada de intake do
Herald (seção 9.3) não é um Checkpoint — pergunta *antes* do Herald
trabalhar, não aprova o que ele já entregou; as duas coisas continuam
distintas mesmo usando o mesmo mecanismo de "perguntar e terminar o
turno".

**O que mudou:**

- **AI/Agents Guild (`0.1.8` → `0.1.9`)** — nova regra "Per-agent
  Checkpoints — a human approval after every step, in every skill";
  "Orchestration model" reescrita para apontar pra essa regra em vez de
  descrever "dois tipos de ponto"; schema do `.quest-progress.json`
  (`version` `"2.0"` → `"3.0"`) ganhou um objeto `steps` por agente
  dentro de `foundation`, cada `features[]` e cada `deploys[]`, com
  `status`/`checkpoint` individuais — uma passagem pelo ciclo de
  correção reseta o estado anterior em vez de acumular histórico.
- **`templates/claude/skills/quest-embark/SKILL.md`,
  `quest-forge/SKILL.md`, `quest-ship/SKILL.md`**
  (`agentTemplatesVersion` `0.1.2` → `0.1.3`) — as três reescritas para
  inserir um Checkpoint depois de cada agente que orquestram, atualizar
  a lógica de "Resuming" pra localizar o primeiro `steps.<agente>`
  ainda não `{ "status": "done", "checkpoint": "approved" }`, e (no
  `/quest-forge`) tratar o ciclo de correção do Warden com reset de
  `steps` em vez de um loop sem parada.
- Pequeno ajuste de precisão no `product-ideation.md`: duas referências
  a "`/quest-embark`'s Checkpoint" (na regra "Vision Mode intake") agora
  apontam pro Checkpoint específico do Herald, já que o combinado não
  existe mais — sincronização cruzada com a mudança acima, sem bump de
  versão próprio (dobrado dentro do changelog `0.1.10` já existente,
  escrito minutos antes nesta mesma sessão).
- `guildhallVersion` (`guilds/manifest.json`): `0.1.12` → **`0.1.13`**.
- `agentTemplatesVersion` (`templates/manifest.json`): `0.1.2` →
  **`0.1.3`**.
- `package.json` (CLI): não mudou nesta rodada.

Ver `CHANGELOG.md` da raiz, entrada `[0.1.13]`, para o detalhe completo.

### 9.5 Dependência entre Quests — mocks e contrato de integração (2026-08-30)

Feedback de uso real, ainda no mesmo dia: nada no sistema tratava uma
Quest que depende de **outra** aplicação ainda não construída — o caso
descrito foi um app frontend que precisa dos dados de um backend, mas o
mesmo problema vale pra qualquer direção (API dependendo de outra API,
CLI dependendo de um serviço). Duas consequências práticas dessa
lacuna: o desenvolvedor não conseguia testar a Quest sozinha enquanto a
outra não existisse, e não havia lugar nenhum registrando o que a outra
aplicação precisaria implementar pra essa Quest funcionar de verdade.

**Decisão**: o Herald passa a perguntar isso explicitamente no intake do
Modo Visão (seção 9.3, ponto 5 — "Known constraints"). Quando a resposta
indica uma dependência assim, o Loremaster ganha uma nova decisão de
arquitetura, no mesmo `/quest-embark`, ao lado de "Persistence
decisions": a estratégia de mock.

- **Estratégia padrão: fixtures estáticas, não interceptação de rede.**
  Dados de mock ficam em `mocks/`, um diretório único na raiz da Quest —
  fácil de achar, sem precisar caçar onde estão. Uma camada fina de
  acesso a dados em `/lib` (a mesma camada de lógica pura que a
  Architecture Guild já exige) é quem de fato lê `mocks/`, e alterna
  para uma chamada de rede real quando a URL base da dependência estiver
  configurada (`.env.example`, convenção já existente da Ops/Infra
  Guild). Uma biblioteca de interceptação de rede (ex: MSW) é permitida
  como desvio com justificativa, mesmo padrão de "Default stack" — não é
  o default, porque a maioria das dependências de um projeto pessoal é
  representável como pares estáticos de request/response, sem precisar
  simular respostas em streaming ou sequências de interação com estado.
- **`docs/integration-contract.md` — o que a outra aplicação precisa
  implementar.** Escrito incrementalmente, mesma disciplina do
  `docs/feature-backlog.md`: o Loremaster cria só um esqueleto no
  `/quest-embark` (título, um parágrafo do porquê da dependência, lista
  vazia de operações necessárias) — os detalhes concretos não existem
  ainda nesse ponto. A cada `/quest-forge` que toca a dependência, o
  Artificer adiciona uma entrada por operação nova que a feature precisa
  — formato de request/response, casos de erro, autenticação — escrita a
  partir do **mesmo formato** da fixture que ele também adiciona em
  `mocks/` pra essa feature. As duas coisas precisam continuar
  descrevendo exatamente a mesma coisa; o Warden confere isso como parte
  da revisão da feature (seção 9.4).
- **Pensado pra alimentar um `/quest-embark` futuro, não só documentar.**
  Cada entrada do contrato é escrita com contexto suficiente (pra que
  serve a operação, não só o formato dela) pra que o desenvolvedor possa
  literalmente colar esse arquivo como a "ideia" de entrada quando for
  rodar `/quest-embark` na Quest da dependência em si — o intake do
  Herald ali vira, na prática, confirmar o que o contrato já diz, não
  começar do zero.

**Nenhuma skill ou template de agente mudou nesta rodada** — Loremaster
e Artificer já leem a Guild inteira antes de agir (seus respectivos
"Required reading"), então a nova regra chega até eles do mesmo jeito
que "Persistence decisions" já chegava, sem o `SKILL.md` do
`/quest-embark` ou do `/quest-forge` precisar citá-la especificamente.

**O que mudou:**

- **Architecture Guild (`0.1.10` → `0.1.11`)** — nova regra "External
  dependencies — mocking and the integration contract"; "Out of scope"
  atualizada pra deixar claro que essa regra só cobre o lado consumidor
  da dependência, não o formato da API que a própria Quest expõe.
- **AI/Agents Guild (`0.1.9` → `0.1.10`)** — "Standard agent output
  locations" ganhou linhas pro `docs/integration-contract.md`
  (Loremaster) e `mocks/` + entradas incrementais do contrato
  (Artificer); "Agent roles and decision authority" nomeou a decisão de
  estratégia de mock explicitamente na linha do Architect.
- **Product/Ideation Guild (`0.1.10` → `0.1.11`)** — ponto 5 do intake
  do Modo Visão agora pergunta explicitamente sobre dependência de outra
  aplicação ainda não construída.
- **Documentation Guild (`0.1.11` → `0.1.12`)** — "Getting started" do
  README aponta pra `mocks/` e `docs/integration-contract.md` quando
  aplicável, em vez de reexplicar o que já está lá.
- `guildhallVersion` (`guilds/manifest.json`): `0.1.13` → **`0.1.14`**.
- `agentTemplatesVersion` (`templates/manifest.json`): não mudou —
  continua **`0.1.3`**.
- `package.json` (CLI): não mudou nesta rodada.

Ver `CHANGELOG.md` da raiz, entrada `[0.1.14]`, para o detalhe completo.

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
- **Atualizar os sete templates de subagente para o modelo de três
  fases** — gap real, não decisão consciente (seção 5.1, seção 9.2):
  `herald.md`, `loremaster.md`, `artificer.md`, `sentinel.md`,
  `warden.md`, `quartermaster.md` e `scribe.md` ainda descrevem a si
  mesmos em termos do fluxo linear de 12 passos (ex: Herald não sabe
  que tem "Vision Mode" e "Feature Brief Mode" — isso vive só nas
  instruções que `/quest-embark` e `/quest-forge` passam a ele na hora
  da delegação). Cada `SKILL.md` novo já nomeia isso como candidato a
  `guild-proposals.md`, mas a entrada ainda não foi criada lá. A rodada
  fixa de perguntas do Modo Visão (seção 9.3) tornou essa contradição
  mais concreta: `herald.md` diz literalmente "never a full intake
  form", frase que hoje descreve o oposto do que o Product/Ideation
  Guild exige — contornado, por enquanto, pelo briefing de delegação do
  `/quest-embark`, mesmo mecanismo já usado pra "Vision Mode"/"Feature
  Brief Mode". Próximo passo natural, não feito neste ciclo de mudanças.

---

## 12. Como retomar este projeto em uma nova conversa

Ao iniciar uma nova conversa, anexe este documento e informe em qual seção
das "Decisões em aberto" (seção 11) você quer continuar, ou descreva o próximo
passo desejado. Este documento reflete o estado da especificação até a data
indicada no topo — decisões tomadas em conversas futuras devem ser
incorporadas de volta aqui para manter a continuidade.
