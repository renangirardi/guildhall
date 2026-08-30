---
name: quest-forge
description: >-
  Repeatable — invoke once per feature, as many times as the Quest
  needs. Orchestrates Herald (Feature Brief Mode), Artificer, Sentinel,
  and Warden for exactly one feature — either an existing
  `docs/feature-backlog.md` entry or a feature described fresh that was
  never in the backlog — the second of three Quest-phase skills
  (AI/Agents Guild, "Orchestration model — three Quest-phase skills").
  Each of those four agents gets its own human Checkpoint immediately
  after it finishes, including every pass through the Artificer/
  Sentinel/Warden fix-retry cycle if Warden flags something (AI/Agents
  Guild, "Per-agent Checkpoints") — this skill no longer chains the four
  agents straight through to a single end-of-turn report. Requires
  `.quest-progress.json`'s `foundation` to already be `done`; if it
  isn't, this skill says so and tells the developer to run
  `/quest-embark` first instead of guessing at a Brief or architecture
  that doesn't exist yet. Appends a new entry to `.quest-progress.json`'s
  `features` array, with a `steps` object per agent, and updates the
  matching `docs/feature-backlog.md` status. Ends the turn at every
  Checkpoint — no new pause mechanism; resuming mid-feature, or forging
  the next one, is the developer's next message. Do not use it to
  establish the Quest's foundation (that's `/quest-embark`) or to deploy
  (that's `/quest-ship`).
argument-hint: "<feature name or slug — from docs/feature-backlog.md, or a new one>"
---

# Quest Forge — single-feature orchestrator

## Naming note
Same rule as `/quest-embark` and the retired `/quest-flow`: the
slash-command name comes from this skill's directory name
(`.claude/skills/quest-forge/SKILL.md` → `/quest-forge`), never from
this file's `name:` frontmatter.

## Purpose and scope
Orchestrates the second of three Quest-phase skills (AI/Agents Guild,
"Orchestration model — three Quest-phase skills"): detailing, building,
testing, and reviewing exactly one feature, end to end, then stopping.
Sequence:
```
Herald, Feature Brief Mode → Checkpoint → Artificer → Checkpoint →
Sentinel → Checkpoint → Warden → Checkpoint → present result
```
Every Checkpoint above is a full stop (AI/Agents Guild, "Per-agent
Checkpoints") — this skill used to run all four agents straight through
to a single end-of-turn report; it no longer does. If Warden flags
something, the resulting fix-retry cycle (Artificer → Sentinel → Warden
again) gets the same treatment: a Checkpoint after each of those steps
too, not an unattended loop that only surfaces once Warden comes back
clean. The developer sees each agent's result as it happens and decides,
at every Checkpoint, whether to approve moving on or to send the flow
back a step — and, once the feature's own last Checkpoint clears,
whether to forge another feature or run `/quest-ship` to publish what's
ready.

**Known gap this skill inherits**: same as `/quest-embark` — the
`herald`, `artificer`, `sentinel`, and `warden` subagent templates
(`.claude/agents/*.md`) still describe the retired step-numbered flow
and haven't been rewritten for Feature Brief Mode or the three-phase
model. Brief each subagent explicitly with this skill's terms when
delegating (named below); this is a real, acknowledged gap, logged in
guildhall's own `guild-proposals.md`, not something this skill silently
works around.

## Prerequisites
Same three-file expectation as `/quest-embark`, for the `herald`,
`artificer`, `sentinel`, and `warden` subagent templates at
`.claude/agents/*.md`, plus this file at
`.claude/skills/quest-forge/SKILL.md`. If any is missing, say so plainly
rather than guessing.

## Before anything else: is the foundation actually done?
Read `.quest-progress.json`. If it's missing, or `foundation.status`
isn't `done`, **stop immediately** and tell the developer to run
`/quest-embark` first — do not attempt to infer a Quest Brief, an
architecture, or a feature backlog that was never actually produced.
`foundation.status` only reaches `done` once every one of its `steps`
entries is itself `{ "status": "done", "checkpoint": "approved" }`
(AI/Agents Guild, "`.quest-progress.json` — schema for the three-phase
model"), so this single check already covers Herald's, Loremaster's, and
Artificer's Checkpoints — no separate check needed here. This is not a
judgment call:
Feature Brief Mode's own Guild rule assumes `type` and the architecture
are already settled (Product/Ideation Guild, "`type` as a default to
confirm ... this rule is Vision-Mode-only"; Architecture Guild,
"Extensibility over premature optimization at `/quest-embark`"), and
proceeding without them means Herald's and Loremaster's work would have
to be guessed at here, which isn't this skill's job.

## Resolving the feature argument
This skill's argument is a feature name or slug. Resolve it, in order:
1. If `docs/feature-backlog.md` has an entry whose slug or name
   matches, use that entry — this is the common case.
2. If the developer's argument names something not in the backlog,
   that's an explicitly supported path, not an error (Product/Ideation
   Guild, "Herald's two modes" — "a developer describing a brand new
   feature at `/quest-forge` invocation time ... is an expected and
   supported path"). Herald adds it to the backlog as part of writing
   its Feature Brief, below.
3. If the argument is ambiguous (matches multiple backlog entries, or
   is too vague to identify a single feature), ask the developer to
   clarify before delegating to Herald — don't guess which one was
   meant.

## Step-by-step orchestration

**Herald — Feature Brief Mode.** Delegate to `herald`, telling it
explicitly it is running in **Feature Brief Mode** for the one resolved
feature (Product/Ideation Guild, "Herald's two modes"). It produces a
complete, detailed Feature Brief at `docs/features/<slug>.md` — Title,
Context, Scope, Out of scope, Acceptance criteria, Edge cases, Open
questions/assumptions ("Feature Brief format — Feature Brief Mode's
output") — covering *only* this feature, nothing else in the backlog.
If the feature was new (not previously in the backlog), Herald adds it
there now, `status: in-progress`. If it already existed as `planned`,
update its status to `in-progress` in `docs/feature-backlog.md`. If this
is the first agent invoked for this feature, add a new entry to
`.quest-progress.json`'s `features` array:
```json
{
  "slug": "<slug>",
  "brief": "docs/features/<slug>.md",
  "status": "in-progress",
  "forgedAt": "<now, ISO 8601>",
  "steps": {
    "herald": { "status": "done", "checkpoint": "pending" },
    "artificer": { "status": "pending", "checkpoint": "pending" },
    "sentinel": { "status": "pending", "checkpoint": "pending" },
    "warden": { "status": "pending", "checkpoint": "pending" }
  }
}
```
per the AI/Agents Guild's `.quest-progress.json` schema. Write the
progress file, then proceed to Herald's own Checkpoint below — do not
proceed to Artificer in the same reply.

**Checkpoint (Herald).** Present a short summary of
`docs/features/<slug>.md` (point at the file, don't re-paste it), flag
anything Herald logged under "Open questions / assumptions", note this
feature's `steps.herald.checkpoint` as `pending`, write the progress
file, and **end your turn**. On the developer's next message: if they
approve, set that field to `approved` and proceed to Artificer in the
same reply; if they ask for changes, route back to Herald and leave the
Checkpoint unresolved.

**Artificer — implementation.** Delegate to `artificer`, only after
Herald's Checkpoint above is `approved`, pointed at the Feature Brief
just written, `docs/architecture.md`, and `docs/quest-brief.md` for
overall context. Same lib-first-then-UI split within the feature the
Architecture Guild already requires — Artificer's own template enforces
this; you don't need to police it. On completion, set this feature's
`steps.artificer.status` to `done`, write the progress file, and proceed
to Artificer's own Checkpoint below.

**Checkpoint (Artificer).** Present a short summary of what Artificer
implemented (point at the actual files changed, don't re-paste them),
note `steps.artificer.checkpoint` as `pending`, write the progress file,
and **end your turn**. On the developer's next message: if they approve,
set that field to `approved` and proceed to Sentinel in the same reply;
if they ask for changes, route back to Artificer and leave the
Checkpoint unresolved.

**Sentinel — tests.** Delegate to `sentinel`, only after Artificer's
Checkpoint above is `approved`, pointed at this feature's code and its
Feature Brief's acceptance criteria and edge cases. On completion, set
`steps.sentinel.status` to `done`, write the progress file, and proceed
to Sentinel's own Checkpoint below.

**Checkpoint (Sentinel).** Present a short summary of what Sentinel
tested and the result (point at the test files, don't re-paste them),
note `steps.sentinel.checkpoint` as `pending`, write the progress file,
and **end your turn**. On the developer's next message: if they approve,
set that field to `approved` and proceed to Warden in the same reply; if
they ask for changes, route back to Sentinel (or to Artificer first, if
the requested change is actually an implementation fix) and leave the
Checkpoint unresolved.

**Warden — review.** Delegate to `warden`, only after Sentinel's
Checkpoint above is `approved`. This is the mandatory review step for
this feature — Warden's report, plus the developer's own Checkpoint
reviewing it, is the closest thing this feature gets to a gate before
the next `/quest-ship` run. On completion, set `steps.warden.status` to
`done`, write the progress file, and proceed to Warden's own Checkpoint
below.

**Checkpoint (Warden).** Present Warden's findings in full — even (and
especially) when it flagged something — note `steps.warden.checkpoint`
as `pending`, write the progress file, and **end your turn**. On the
developer's next message, exactly one of:
- **Warden's review was clean, and the developer approves** → set
  `steps.warden.checkpoint` to `approved`, and proceed to "Record
  completion" below in the same reply.
- **Warden flagged something, and the developer wants it fixed** → set
  `steps.warden.checkpoint` to `approved` (the developer has reviewed
  and agreed with the finding — this Checkpoint's job is done; the fix
  itself is new work), reset `steps.artificer`, `steps.sentinel`, and
  `steps.warden` to `{ "status": "pending", "checkpoint": "pending" }`
  (Warden included — it hasn't re-reviewed anything yet), write the
  progress file, and re-enter the cycle at Artificer (fix) → its own
  Checkpoint → Sentinel (re-test) → its own Checkpoint → Warden
  (re-review) → its own Checkpoint — same fix-cycle discipline the
  retired `/quest-flow` skill used at its step-9 Checkpoint, now with a
  human Checkpoint after every step of the retry too, not just the first
  pass (AI/Agents Guild, "Per-agent Checkpoints": "each step's own
  state, not a retry history" — these resets overwrite the prior pass's
  recorded state rather than appending a new one).
- **The developer explicitly accepts a flagged item as-is** → state that
  explicitly in the progress file's note (or equivalent), set
  `steps.warden.checkpoint` to `approved`, and proceed to "Record
  completion" below — an accepted flag is not the same as a fix, and
  does not re-enter the cycle.

**Record completion.** Once Warden's Checkpoint clears (clean-and-
approved, or explicitly-accepted-as-is — never merely "Warden's review
came back"), set this feature's `.quest-progress.json` entry `status` to
`done`, and update its `docs/feature-backlog.md` entry to `status:
done`. Write the progress file.

## Ending the turn
This skill introduces no new pause *mechanism* (AI/Agents Guild,
"Orchestration model — three Quest-phase skills") — every Checkpoint
above is the same "present, then end the turn" pattern — but it now
applies after each of the four agents (and after each pass through the
fix-retry cycle), not once at the very end. Resuming mid-feature (e.g.
if Artificer's implementation spans multiple sessions, or a Checkpoint
is still pending) follows the same "Resuming" discipline `/quest-embark`
uses: re-read `.quest-progress.json`, find this feature's entry, locate
the first `steps.<agent>` that isn't `{ "status": "done", "checkpoint":
"approved" }`, and continue exactly there — delegating to that agent if
its `status` is still `pending`, or re-presenting its already-finished
output fresh (per `/quest-embark`'s same "a `/clear` or a new session
wipes the developer's context too" caution) if its `status` is `done`
but its `checkpoint` is still `pending` — rather than re-deriving what's
left from conversation memory.

## Respecting gates that live inside the subagents
Same rule as `/quest-embark`: this skill's own gates are the per-agent
Checkpoints above (including every pass through the fix-retry cycle). It
never routes around a subagent's own `agent-recommended, human-confirmed`
gate — if one fires, let the turn end there and record state in
`.quest-progress.json`.

## Before you finish (any step, any turn)
1. Write `.quest-progress.json` with the current state before ending
   your turn.
2. State plainly which feature this invocation covered, what step it's
   on, and — if you stopped mid-feature — exactly what's left.
3. Once a feature's status is `done`, say so plainly and note that the
   developer can forge another feature or run `/quest-ship` to publish
   what's ready — including this one.
4. Apply the generalization test (`docs/spec.md` section 6) to any gap
   this skill didn't anticipate: five-unrelated-Quests test decides
   `guild-proposals.md` versus an inline note.
