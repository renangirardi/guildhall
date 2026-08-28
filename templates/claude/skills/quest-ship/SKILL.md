---
name: quest-ship
description: >-
  Repeatable, on demand — invoke whenever there's something ready to
  publish, without waiting for the whole feature backlog to reach
  `done`. Runs a Checkpoint reviewing every feature in
  `.quest-progress.json`'s `features` array not yet covered by a prior
  `deploys[].featuresIncluded` entry, then Quartermaster (deploy +
  monitoring) and Scribe (incremental documentation update, scoped to
  this run's shipped features) — the third of three Quest-phase skills
  (AI/Agents Guild, "Orchestration model — three Quest-phase skills").
  Appends a new entry to `.quest-progress.json`'s `deploys` array
  recording which features this run included. Requires
  `.quest-progress.json`'s `foundation` to already be `done`; if it
  isn't, or if there is nothing new to ship since the last deploy, this
  skill says so rather than deploying anyway. Do not use it to establish
  the Quest's foundation (that's `/quest-embark`) or to detail/build a
  single feature (that's `/quest-forge <feature>`).
argument-hint: "[nothing — reviews whatever is ready since the last deploy]"
---

# Quest Ship — deploy orchestrator

## Naming note
Same rule as `/quest-embark`, `/quest-forge`, and the retired
`/quest-flow`: the slash-command name comes from this skill's directory
name (`.claude/skills/quest-ship/SKILL.md` → `/quest-ship`), never from
this file's `name:` frontmatter.

## Purpose and scope
Orchestrates the third of three Quest-phase skills (AI/Agents Guild,
"Orchestration model — three Quest-phase skills"): a pre-deploy
Checkpoint, the deploy itself, post-deploy monitoring, and an
incremental documentation update — repeatable, on demand, publishing
whatever is ready as of this invocation rather than waiting for the
full backlog. Sequence:
```
Checkpoint (review what's new since last deploy) → Quartermaster →
Scribe, incremental update
```

**Known gap this skill inherits**: same as `/quest-embark` and
`/quest-forge` — the `quartermaster` and `scribe` subagent templates
(`.claude/agents/quartermaster.md`, `scribe.md`) still describe the
retired step-numbered flow (a single deploy at "step 10", a single
"final documentation" pass at "step 12") and haven't been rewritten for
a repeatable `/quest-ship`. Brief both explicitly with this skill's
terms when delegating (named below); this is logged in guildhall's own
`guild-proposals.md`, not silently worked around.

## Prerequisites
Same three-file expectation as the other two skills, for the
`quartermaster` and `scribe` subagent templates at
`.claude/agents/*.md`, plus this file at
`.claude/skills/quest-ship/SKILL.md`.

## Before anything else: is there a foundation, and is there anything new?
1. Read `.quest-progress.json`. If it's missing, or `foundation.status`
   isn't `done`, stop and tell the developer to run `/quest-embark`
   first — there is nothing to ship without an approved Brief and
   architecture.
2. Compute the set of **shippable features**: every entry in `features`
   with `status: done` whose `slug` does not already appear in any
   prior `deploys[].featuresIncluded` array. This is the "what's new
   since the last deploy" set this skill's Checkpoint reviews.
3. If that set is empty — every `done` feature has already shipped, and
   nothing new is ready — say so plainly and stop. Do not deploy just
   because the skill was invoked; `/quest-ship` publishes what's ready,
   not "runs regardless." (A Quest with zero prior deploys and at least
   one `done` feature always has a non-empty set the first time this
   runs.)

## Step-by-step orchestration

**Checkpoint (human) — pre-deploy review.** Present the
shippable-features set computed above (each feature's slug and a
one-line summary from its `docs/features/<slug>.md` "Context" section),
any Warden findings still open against them (re-read from the relevant
`/quest-forge` session if not already durable — the same "don't assume
the developer already saw this" discipline the retired `/quest-flow`
skill's Checkpoints used), and the blocking-CI status. Record this
run's pending deploy state (the shippable-features set) somewhere
durable before ending your turn — do not hold it only in conversation
memory, since a `/clear` or a new session would lose it. **End your
turn.** On the developer's next message: if they approve, proceed to
Quartermaster with exactly that feature set; if they want to exclude a
feature or request changes, route back through `/quest-forge` for that
feature (fix → Sentinel → Warden again) and re-present a revised
Checkpoint — never silently shrink or grow the feature set without the
developer seeing the updated list. Never infer approval from silence or
from the developer moving on to a different topic.

**Quartermaster — deploy and monitoring.** Delegate to `quartermaster`,
pointed at the approved feature set. Same applicability check
Quartermaster's own template already performs (`cli`/`script` Quests
have nothing to deploy — Ops/Infra and Monitoring Guilds both
explicitly don't apply); if that's this Quest's type, say so and skip
straight to the Scribe step below with an empty deploy (still worth
recording, so a `/quest-ship` invocation on a `cli`/`script` Quest isn't
silently a no-op — see "Recording the deploy" below for what that looks
like when there's no real deploy target). Otherwise, Quartermaster
verifies every blocking check, deploys, and begins post-deploy
monitoring exactly as its own template already describes.

**Scribe — incremental documentation update.** Delegate to `scribe`,
telling it explicitly which features this run's `deploys` entry covers
(the approved feature set above) — this is the input the Documentation
Guild's "Incremental updates — Scribe's cadence at `/quest-ship`" rule
requires. Scribe updates `README.md` (and any other governed docs) in
light of *only* those features, editing the existing document in place
rather than rewriting it from scratch, and does not assume this is the
last `/quest-ship` run the Quest will ever see.

## Recording the deploy
Append a new entry to `.quest-progress.json`'s `deploys` array:
```json
{
  "deployedAt": "<now, ISO 8601>",
  "checkpoint": "approved",
  "featuresIncluded": ["<slug>", "..."],
  "note": "<optional — anything a future /quest-ship or a human needs, e.g. 'cli Quest, no real deploy target'>"
}
```
per the AI/Agents Guild's `.quest-progress.json` schema.
`featuresIncluded` is exactly the approved feature set from the
Checkpoint above — never retroactively edited to include a feature
forged after this deploy ran (AI/Agents Guild, same schema section: "it
does not retroactively include features forged after that deploy
already ran"). Write the progress file before ending your turn.

## Respecting gates that live inside the subagents
Same rule as the other two skills: this skill's only gate is the one
Checkpoint above. It does not route around Quartermaster's Rollback or
Incident-response `agent-recommended, human-confirmed` gates, or any
other subagent gate — if one fires mid-invocation, let the turn end
there and record state in `.quest-progress.json` (e.g. this run's
deploy still pending, waiting on a rollback confirmation).

## Before you finish (any step, any turn)
1. Write `.quest-progress.json` with the current state before ending
   your turn — the pending Checkpoint's feature set, or the completed
   `deploys` entry.
2. State plainly which features this run shipped (or is proposing to
   ship), what step you're on, and — if you stopped — exactly what
   you're waiting for.
3. If an incident occurred during monitoring, note that Quartermaster
   (not Scribe) writes the incident doc immediately per the
   Documentation Guild's format — this skill doesn't defer that
   write-up to a later `/quest-ship` run.
4. Apply the generalization test (`docs/spec.md` section 6) to any gap
   this skill didn't anticipate: five-unrelated-Quests test decides
   `guild-proposals.md` versus an inline note.
