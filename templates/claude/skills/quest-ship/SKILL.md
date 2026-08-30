---
name: quest-ship
description: >-
  Repeatable, on demand — invoke whenever there's something ready to
  publish, without waiting for the whole feature backlog to reach
  `done`. Runs a pre-deploy scope Checkpoint reviewing every feature in
  `.quest-progress.json`'s `features` array not yet covered by a prior
  `deploys[].featuresIncluded` entry, then Quartermaster (deploy +
  monitoring, with its own Checkpoint once done) and Scribe (incremental
  documentation update, scoped to this run's shipped features, also with
  its own Checkpoint) — the third of three Quest-phase skills (AI/Agents
  Guild, "Orchestration model — three Quest-phase skills" and "Per-agent
  Checkpoints"). Appends a new entry to `.quest-progress.json`'s
  `deploys` array, with a `steps` object per agent, recording which
  features this run included. Requires `.quest-progress.json`'s
  `foundation` to already be `done`; if it isn't, or if there is nothing
  new to ship since the last deploy, this skill says so rather than
  deploying anyway. Do not use it to establish the Quest's foundation
  (that's `/quest-embark`) or to detail/build a single feature (that's
  `/quest-forge <feature>`).
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
"Orchestration model — three Quest-phase skills"): a pre-deploy scope
Checkpoint, the deploy itself, post-deploy monitoring, and an
incremental documentation update — repeatable, on demand, publishing
whatever is ready as of this invocation rather than waiting for the
full backlog. Sequence:
```
Checkpoint (scope — review what's new since last deploy) →
Quartermaster → Checkpoint → Scribe, incremental update → Checkpoint
```
The first Checkpoint is different in kind from the other two (AI/Agents
Guild, "Per-agent Checkpoints"): it reviews and decides *scope* before
either agent has done anything, the same as it always has. The other two
are the newer kind — approving Quartermaster's and Scribe's completed
work, each in turn, before the next step proceeds or this run's `deploys`
entry is considered finished.

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

**Checkpoint (scope) — pre-deploy review.** Present the
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
Quartermaster with exactly that feature set — appending a new entry to
`.quest-progress.json`'s `deploys` array right away, before Quartermaster
does anything, so mid-flow state has somewhere to live:
```json
{
  "deployedAt": null,
  "checkpoint": "approved",
  "steps": {
    "quartermaster": { "status": "pending", "checkpoint": "pending" },
    "scribe": { "status": "pending", "checkpoint": "pending" }
  },
  "featuresIncluded": ["<slug>", "..."]
}
```
(`deployedAt` fills in once Quartermaster actually deploys — see
"Recording the deploy" below.) If they want to exclude a feature or
request changes, route back through `/quest-forge` for that feature
(which now runs its own fix-retry cycle with a Checkpoint after every
step, not an unattended loop — AI/Agents Guild, "Per-agent Checkpoints")
and re-present a revised scope Checkpoint — never silently shrink or
grow the feature set without the developer seeing the updated list.
Never infer approval from silence or from the developer moving on to a
different topic. This scope Checkpoint's own `checkpoint` field — the
top-level one on the `deploys` entry, not either agent's `steps` entry —
is what's `approved` here; it stays a separate fact from Quartermaster's
and Scribe's own Checkpoints below.

**Quartermaster — deploy and monitoring.** Delegate to `quartermaster`,
only after the scope Checkpoint above is `approved`, pointed at the
approved feature set. Same applicability check Quartermaster's own
template already performs (`cli`/`script` Quests have nothing to deploy
— Ops/Infra and Monitoring Guilds both explicitly don't apply); if
that's this Quest's type, say so, set `steps.quartermaster.status` to
`done` with a note that there was no real deploy target, and still
present Quartermaster's own Checkpoint below before moving to Scribe —
see "Recording the deploy" for what the empty-deploy case looks like.
Otherwise, Quartermaster verifies every blocking check, deploys, and
begins post-deploy monitoring exactly as its own template already
describes. On completion, set `steps.quartermaster.status` to `done`,
write the progress file, and proceed to Quartermaster's own Checkpoint
below — do not proceed to Scribe in the same reply.

**Checkpoint (Quartermaster).** Present what was deployed and what
monitoring found (point at the actual deploy/monitoring output, don't
re-paste it), note `steps.quartermaster.checkpoint` as `pending`, write
the progress file, and **end your turn**. On the developer's next
message: if they approve, set that field to `approved` and proceed to
Scribe in the same reply; if they ask for changes (including a
rollback, which stays gated by Quartermaster's own
`agent-recommended, human-confirmed` rule regardless of this Checkpoint),
route back to Quartermaster and leave the Checkpoint unresolved.

**Scribe — incremental documentation update.** Delegate to `scribe`,
only after Quartermaster's Checkpoint above is `approved`, telling it
explicitly which features this run's `deploys` entry covers (the
approved feature set above) — this is the input the Documentation
Guild's "Incremental updates — Scribe's cadence at `/quest-ship`" rule
requires. Scribe updates `README.md` (and any other governed docs) in
light of *only* those features, editing the existing document in place
rather than rewriting it from scratch, and does not assume this is the
last `/quest-ship` run the Quest will ever see. On completion, set
`steps.scribe.status` to `done`, write the progress file, and proceed to
Scribe's own Checkpoint below.

**Checkpoint (Scribe).** Present what Scribe updated (point at the
actual doc diffs, don't re-paste them), note `steps.scribe.checkpoint`
as `pending`, write the progress file, and **end your turn**. On the
developer's next message: if they approve, set that field to `approved`
and proceed to "Recording the deploy" below in the same reply; if they
ask for changes, route back to Scribe and leave the Checkpoint
unresolved — this run's `deploys` entry is not considered finished until
this Checkpoint clears.

## Recording the deploy
By the time this section applies, the `deploys` entry already exists
(created at the scope Checkpoint above) with both `steps` entries now
`{ "status": "done", "checkpoint": "approved" }`. Fill in `deployedAt`
(now, ISO 8601 — or leave `null` with a `note` explaining why, for the
`cli`/`script` no-real-deploy-target case) and an optional `note`:
```json
{
  "deployedAt": "<now, ISO 8601>",
  "checkpoint": "approved",
  "steps": {
    "quartermaster": { "status": "done", "checkpoint": "approved" },
    "scribe": { "status": "done", "checkpoint": "approved" }
  },
  "featuresIncluded": ["<slug>", "..."],
  "note": "<optional — anything a future /quest-ship or a human needs, e.g. 'cli Quest, no real deploy target'>"
}
```
per the AI/Agents Guild's `.quest-progress.json` schema.
`featuresIncluded` is exactly the approved feature set from the scope
Checkpoint — never retroactively edited to include a feature forged
after this deploy ran (AI/Agents Guild, same schema section: "it does
not retroactively include features forged after that deploy already
ran"). Write the progress file before ending your turn.

## Respecting gates that live inside the subagents
Same rule as the other two skills: this skill's own gates are the scope
Checkpoint and the two per-agent Checkpoints above. It does not route
around Quartermaster's Rollback or Incident-response
`agent-recommended, human-confirmed` gates, or any other subagent gate —
if one fires mid-invocation, let the turn end there and record state in
`.quest-progress.json` (e.g. this run's deploy still pending, waiting on
a rollback confirmation).

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
