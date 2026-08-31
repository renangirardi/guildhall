# guildhall

Core repository of the AetherForge system: guild standards and
agent-orchestration templates, distributed as an installable,
zero-dependency CLI.

## Install (local, no npm registry needed)

```bash
cd guildhall
npm link
```

This makes the `guildhall` command available globally, pointing at this
local checkout.

## The Quest workflow

A **Quest** is a project scaffolded by this CLI. Once initialized, it's
driven by three Claude Code skills, run in this order:

| Phase | Skill | Cardinality |
| --- | --- | --- |
| Quest foundation (vision, architecture, scaffold) | `/quest-embark` | Once per Quest |
| Detail + build one feature | `/quest-forge <feature>` | Repeatable, once per feature |
| Publish | `/quest-ship` | Repeatable, on demand |

Each skill hands work to a fixed sequence of agents (Herald, Loremaster,
Artificer, Sentinel, Warden, Quartermaster, Scribe), each consulting the
relevant Guild docs, with a human checkpoint after every agent step. The
full spec — terminology, the three-phase model, the Guild-proposal
mechanism, enforcement rules — lives in [`docs/spec.md`](docs/spec.md)
(Portuguese). Guild/agent-template version history is in
[`CHANGELOG.md`](CHANGELOG.md).

## Usage

Initialize a new Quest with the guilds and agent-orchestration templates
relevant to its type:

```bash
guildhall init ./my-quest --type=web-app
```

Quest types currently recognized: `web-app`, `api`, `cli`, `script`
(see `guilds/manifest.json` for which guilds apply to each).

This installs, into `./my-quest`:

- `guilds/` — the Guild docs that apply to this quest type.
- `.claude/agents/` and `.claude/skills/` (`quest-embark`, `quest-forge`,
  `quest-ship`) — the agent-orchestration templates described above,
  plus `.claude/quest-manifest.json` (the full agent manifest, for
  skills to read `appliesTo` at runtime).
- `.guildhall-lock.json` — records the installed guild/agent versions
  and quest type, so `update` knows what to refresh.
- `guild-proposals.md` and `process-gaps.md` — scaffolded empty, for
  agents to log candidate Guild rules and out-of-scope findings as the
  Quest progresses.
- `docs/feature-backlog.md` and `docs/features/` — scaffolded empty,
  populated by Herald during `/quest-embark` and `/quest-forge`.

Update an existing Quest to the latest guildhall version (guilds, agent
templates, and skills):

```bash
guildhall update ./my-quest
```

Review proposals logged by agents across one or more Quests:

```bash
guildhall review-proposals ./my-quest ./another-quest
```

Prints each Quest's `guild-proposals.md` (candidate Guild rules) and
`process-gaps.md` (real findings an agent judged out of its scope to act
on or propose right now — see `guilds/ai-agents.md`, "Logging a
`process-gaps.md` entry") in separate sections. Promotion of a proposal
into an actual guild file is always manual — this command only surfaces
proposals and process gaps for human review, per the master spec
(section 6).

## Adding or editing a guild

1. Edit or add a file under `guilds/`.
2. Register it in `guilds/manifest.json` with `id`, `file`, `type`
   (`core` | `conditional`), and `appliesTo` (quest types).
3. Bump `version` in `manifest.json`.
4. Existing Quests stay on their locked version until `guildhall update`
   is run against them.

Every rule inside a guild file should carry an `Enforcement:` tag
(`automated`, `automated (custom)`, or `agent-reviewed`) — see the master
spec, section 10.
