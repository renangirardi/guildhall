---
name: quest-forge
description: >-
  Repeatable — invoke once per feature, as many times as the Quest
  needs. Orchestrates Herald (Feature Brief Mode), Artificer, Sentinel,
  and Warden for exactly one feature — either an existing
  `docs/feature-backlog.md` entry or a feature described fresh that was
  never in the backlog — the second of three Quest-phase skills
  (AI/Agents Guild, "Orchestration model — three Quest-phase skills").
  Requires `.quest-progress.json`'s `foundation` to already be `done`;
  if it isn't, this skill says so and tells the developer to run
  `/quest-embark` first instead of guessing at a Brief or architecture
  that doesn't exist yet. Appends a new entry to `.quest-progress.json`'s
  `features` array and updates the matching `docs/feature-backlog.md`
  status. Ends the turn presenting the result — no new pause mechanism;
  resuming mid-feature, or forging the next one, is the developer's next
  message. Do not use it to establish the Quest's foundation (that's
  `/quest-embark`) or to deploy (that's `/quest-ship`).
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
Herald, Feature Brief Mode → Artificer → Sentinel → Warden →
present result
```
No Checkpoint lives inside this skill — a feature's review is Warden's
job, not a human pause (AI/Agents Guild, same section). The developer
sees the result at the end of this skill's turn and decides what to do
next: forge another feature, or run `/quest-ship` to publish what's
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
isn't `done`, or `foundation.checkpoint` isn't `approved`, **stop
immediately** and tell the developer to run `/quest-embark` first — do
not attempt to infer a Quest Brief, an architecture, or a feature
backlog that was never actually produced. This is not a judgment call:
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
update its status to `in-progress` in `docs/feature-backlog.md` and add
a new entry to `.quest-progress.json`'s `features` array:
```json
{
  "slug": "<slug>",
  "brief": "docs/features/<slug>.md",
  "status": "in-progress",
  "forgedAt": "<now, ISO 8601>"
}
```
per the AI/Agents Guild's `.quest-progress.json` schema. Write the
progress file before proceeding.

**Artificer — implementation.** Delegate to `artificer`, pointed at the
Feature Brief just written, `docs/architecture.md`, and
`docs/quest-brief.md` for overall context. Same lib-first-then-UI split
within the feature the Architecture Guild already requires —
Artificer's own template enforces this; you don't need to police it.

**Sentinel — tests.** Delegate to `sentinel` once Artificer confirms
the feature is implemented, pointed at this feature's code and its
Feature Brief's acceptance criteria and edge cases.

**Warden — review.** Delegate to `warden`. This is the mandatory review
step for this feature — there is no human Checkpoint inside
`/quest-forge`, so Warden's report is the closest thing this feature
gets to a gate before the next `/quest-ship` run. If Warden flags
anything, route back through Artificer (fix) → Sentinel (tests for the
fix, if needed) → **Warden again** — same fix-cycle discipline the
retired `/quest-flow` skill used at its step-9 Checkpoint, just without
a human in the loop at this stage.

**Record completion.** Once Warden's review is clean (or the developer
explicitly accepts flagged items as-is — state that explicitly if so),
set this feature's `.quest-progress.json` entry `status` to `done`, and
update its `docs/feature-backlog.md` entry to `status: done`. Write the
progress file.

## Ending the turn
This skill introduces no new pause mechanism (AI/Agents Guild,
"Orchestration model — three Quest-phase skills"): once Warden's review
is in and the feature's status is recorded, present the result — what
was built, tested, and found — and end your turn. Resuming mid-feature
(e.g. if Artificer's implementation spans multiple sessions) follows
the same "Resuming" discipline `/quest-embark` and the retired
`/quest-flow` skill both use: re-read `.quest-progress.json`, find this
feature's entry, and continue from whatever it says rather than
re-deriving what's left from conversation memory.

## Respecting gates that live inside the subagents
Same rule as `/quest-embark`: this skill adds no gate of its own beyond
the mandatory Warden review above. It never routes around a subagent's
own `agent-recommended, human-confirmed` gate — if one fires, let the
turn end there and record state in `.quest-progress.json`.

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
