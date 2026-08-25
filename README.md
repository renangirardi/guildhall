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

## Usage

Initialize a new Quest with the guilds relevant to its type:

```bash
guildhall init ./my-quest --type=web-app
```

Quest types currently recognized: `web-app`, `api`, `cli`, `script`
(see `guilds/manifest.json` for which guilds apply to each).

Update an existing Quest to the latest guildhall version:

```bash
guildhall update ./my-quest
```

Review proposals logged by agents across one or more Quests:

```bash
guildhall review-proposals ./my-quest ./another-quest
```

Promotion of a proposal into an actual guild file is always manual — this
command only surfaces proposals for human review, per the master spec
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
