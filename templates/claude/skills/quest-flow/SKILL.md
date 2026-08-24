---
name: quest-flow
description: >-
  Orchestrates a Quest through the full AI Adventure development flow
  (master spec, section 5) as a sequence of subagent invocations: Herald,
  Loremaster, a human Checkpoint, Artificer, Sentinel, Warden, a second
  human Checkpoint, Quartermaster (skipped entirely for cli/script
  Quests), and Scribe. Tracks progress in `.quest-progress.json` at the
  Quest root so the flow resumes correctly across sessions, including
  after a `/clear` or a brand-new conversation. Use it to kick off a new
  Quest from a loose idea, or to continue an existing one — it reads
  `.quest-progress.json` first and resumes from the last confirmed step
  instead of starting over. Do not use it to invoke a single agent out of
  sequence (call that agent directly instead) and do not use it to push
  past a Checkpoint or any agent's own `agent-recommended,
  human-confirmed` gate — this skill only sequences the normal flow, it
  never overrides those gates.
argument-hint: "[one-paragraph idea for a new Quest, or nothing to resume an existing one]"
---

# Quest Flow — development flow orchestrator

## Naming note
This skill is invoked as `/quest-flow`, not `/quest`. In Claude Code, a
project skill's slash-command name comes from its directory name
(`.claude/skills/<dir>/SKILL.md` → `/<dir>`), not from this file's
`name:` frontmatter — that field only sets the display label shown in
skill listings. Since the directory this template installs into is fixed
as `quest-flow`, the invocation is `/quest-flow`. A shorter `/quest`
would require either renaming the directory (losing the descriptive name
that makes the skill's purpose obvious in a listing of many skills) or
wrapping this file in a second skill directory named `quest`, which would
just be indirection for no benefit. `quest-flow` was kept as both the
directory and the more legible choice.

## Purpose and scope
This skill orchestrates `docs/spec.md` section 5's development flow, one
Quest at a time, as this exact sequence:

```
Herald → Loremaster → Checkpoint (step 4) → Artificer → Sentinel →
Warden → Checkpoint (step 9) → Quartermaster → Scribe
```

It does not implement any step's actual work — every step's substance
lives in that step's own subagent template
(`.claude/agents/<agent>.md`, installed from this repository's
`templates/claude/agents/`). This skill's only job is: know what step
comes next, know what "next" depends on, hand off to the right agent
with the right context, record what happened, and stop cleanly at the
two human Checkpoints.

## How a Checkpoint actually "pauses" — read this before anything else
There is no pause, callback, polling loop, or background process
anywhere in this flow. A Checkpoint (steps 4 and 9) is nothing more than
this skill's instructions telling you, the assistant, to present the
prior steps' output and **end your turn** — the same way any response
ends. The "resume" happens because the developer sends a new message
(in this session or a future one), and this skill's instructions (loaded
fresh, or still active in context) pick the flow back up. `.quest-
progress.json` exists specifically so that pickup works correctly even
if the new message arrives in a session that never saw the earlier turns
— it is a plain state file on disk, read and written like any other
file, not a signal, event, or lock. Do not build, suggest, or assume any
additional mechanism for this. If a future revision of this skill seems
to need one, that is a sign the flow's shape has changed, not that this
file was missing a feature.

## Prerequisites — and a gap this exposed
This skill assumes three things already exist inside the Quest's own
repository, copied there from this guildhall checkout:
1. The seven subagent templates, at `.claude/agents/*.md` (`herald.md`,
   `loremaster.md`, `artificer.md`, `sentinel.md`, `warden.md`,
   `quartermaster.md`, `scribe.md`).
2. This file, at `.claude/skills/quest-flow/SKILL.md`.
3. The agent applicability manifest, at `.claude/quest-manifest.json` —
   a copy of this repository's `templates/manifest.json`, used below to
   decide whether Quartermaster applies to this Quest's type at all.

**Known gap, surfaced while writing this skill**: `bin/cli.js`'s `init`
command currently only copies `guilds/*.md` (per `guilds/manifest.json`)
into a new Quest — there is no equivalent step that copies
`templates/claude/agents/`, `templates/claude/skills/`, or
`templates/manifest.json`. Until that's added, getting these three
prerequisites into a Quest is a manual step. This is logged in
guildhall's own `guild-proposals.md` (root of this repository) as a
proposal to extend `init`/`update`; it is exactly the "multi-agent
orchestration mechanics" question `guilds/ai-agents.md` names as
explicitly out of scope and left for `docs/spec.md` section 11 to
settle. If you hit this gap mid-Quest (the manifest or an agent file is
missing where expected), say so plainly and ask the developer where
these files actually live for this Quest, rather than guessing a path or
silently skipping a step.

## The progress file — `.quest-progress.json`
Lives at the Quest root, next to `docs/quest-brief.md`. Written after
every step completes or a Checkpoint is reached — never held only in
conversation memory, since that's exactly what doesn't survive a
`/clear` or a new session.

Schema:

```json
{
  "version": "1.0",
  "questType": "web-app",
  "updatedAt": "2026-08-24T00:00:00Z",
  "steps": {
    "2":  { "name": "Quest Brief",                    "agent": "herald",        "status": "done" },
    "3":  { "name": "Architecture design",             "agent": "loremaster",    "status": "done" },
    "4":  { "name": "Checkpoint — brief + architecture","type": "checkpoint",    "status": "approved" },
    "5":  { "name": "Scaffold",                         "agent": "artificer",     "status": "done" },
    "6":  { "name": "Implementation",                   "agent": "artificer",     "status": "in-progress" },
    "7":  { "name": "Tests",                             "agent": "sentinel",      "status": "pending" },
    "8":  { "name": "Code review",                       "agent": "warden",        "status": "pending" },
    "9":  { "name": "Checkpoint — pre-deploy review",     "type": "checkpoint",     "status": "pending" },
    "10": { "name": "Deploy",                             "agent": "quartermaster", "status": "pending" },
    "11": { "name": "Post-deploy monitoring",             "agent": "quartermaster", "status": "pending" },
    "12": { "name": "Final documentation",                "agent": "scribe",        "status": "pending" }
  }
}
```

Rules for this file:
- `questType` mirrors `docs/quest-brief.md`'s `Type` field, cached here
  for convenience once Herald has written it. `docs/quest-brief.md`
  remains the source of truth — re-read it before trusting this cached
  copy for anything decision-relevant (in particular the Quartermaster
  applicability check below); don't let a stale cache drive a real
  decision.
- Per-step `status` is one of: `pending` (not started), `in-progress`
  (started, not yet confirmed complete — the normal state for step 6
  across a multi-session implementation), `done`, or `skipped` (used
  only for steps 10-11 when Quartermaster doesn't apply — see below).
- Checkpoint `status` is `pending` (reached, not yet reviewed) or
  `approved`. A checkpoint is never marked `approved` except by an
  explicit developer confirmation in the conversation — never infer
  approval from silence, from the developer moving on to a different
  topic, or from your own judgment that the output "looks fine."
- Add a free-text `"note"` field to any step when there's context a
  future resume needs (why something was skipped, what a partial
  implementation still has left, why a step is blocked on something
  outside this flow).
- Step 1 (ideation) is never in this file — it's the developer's
  message that starts a new Quest, not an agent invocation.

## Resuming — what to do on every invocation, before anything else
1. Look for `.quest-progress.json` at the Quest root.
2. **Missing** → this is a new Quest. If the invocation included an
   idea, that text is step 1's output; proceed straight to Herald
   (below) and create the progress file as you go. If no idea was given
   and nothing in the conversation supplies one, ask for it — don't
   invent a starting point.
3. **Present** → read it fully. Find the first step, in order 2 through
   12, whose status is not `done`, `approved`, or `skipped`. That is
   where you resume:
   - If it's a checkpoint with status `pending`: **do not** assume it
     was already presented to the developer in a way they've seen —
     re-read whatever it reviews (Quest Brief + architecture for step 4,
     Warden's findings for step 9; re-run Warden if its findings weren't
     persisted anywhere durable) and present it fresh, then stop. A
     `/clear` or a new session means the developer's context was wiped
     too, even if yours technically wasn't.
   - If it's `in-progress`: hand off to that step's agent again, telling
     it explicitly that this is a continuation — it should check current
     repository state itself (every agent template already does this
     under "Prior state") rather than you trying to summarize what's
     left.
   - If it's `pending` and its prerequisites are `done`/`approved`:
     proceed normally.
4. Never re-run a step marked `done` or a checkpoint marked `approved`
   without the developer explicitly asking to revisit it.

## Step-by-step orchestration

**Step 2 — Quest Brief (Herald).** Delegate to the `herald` subagent
with the developer's idea (fresh Quest) or instruction to revise
(existing, unapproved brief). On completion, set step 2 to `done`,
capture `questType` from the resulting `docs/quest-brief.md`, and
proceed to step 3.

**Step 3 — Architecture design (Loremaster).** Delegate to `loremaster`.
It reads `docs/quest-brief.md` itself — you don't need to restate it.
On completion, set step 3 to `done` and proceed to the Checkpoint.

**Step 4 — Checkpoint (human).** Present a short summary of
`docs/quest-brief.md` and `docs/architecture.md` (not a re-paste of
either in full — point at the files), flag any deviations Loremaster
called out, set this checkpoint's status to `pending`, write the
progress file, and **end your turn**. On the developer's next message:
if they approve, set status to `approved` and continue to step 5 in the
same reply; if they ask for changes, route back to Herald and/or
Loremaster as appropriate, leaving the checkpoint `pending`.

**Step 5 — Scaffold (Artificer).** Delegate to `artificer`, pointed at
the now-approved Brief and architecture. On completion, set step 5 to
`done` and proceed to step 6 without waiting for confirmation — nothing
between steps 4 and 9 is a Checkpoint.

**Step 6 — Implementation (Artificer).** Delegate to `artificer` to
build out the Brief's Scope, feature by feature, lib-first-then-UI
within each feature — Artificer's own template already enforces this
split; you don't need to police it. This step commonly spans multiple
invocations, possibly across sessions: set status to `in-progress` after
the first hand-off, and only to `done` once Artificer itself confirms
the full Scope is implemented. On resume mid-implementation, follow the
"Resuming" section above rather than re-deriving what's left yourself.

**Step 7 — Tests (Sentinel).** Delegate to `sentinel` once step 6 is
`done`. On completion, record the coverage numbers Sentinel reports (a
`note` on this step is a reasonable place) and set status to `done`.

**Step 8 — Code review (Warden).** Delegate to `warden`. Warden's report
is what the step-9 Checkpoint relies on — make sure it's captured
somewhere durable (the conversation alone doesn't survive a session
boundary) before proceeding; if Warden doesn't already write its
findings to a file, note the key findings inline in this step's `note`
field so a resumed session can still present them at step 9. Set status
to `done`. This is not necessarily a one-time invocation for the Quest:
any fix cycle triggered by the step-9 Checkpoint below sends work back
through Warden too, so expect to set step 8 back to `in-progress` (or
track the re-review under the same step, whichever the `note` field
makes clearer) and to `done` again once the fresh review is complete.

**Step 9 — Checkpoint (human).** Present Warden's findings (clean, or
what's flagged) and the blocking-CI status Warden reported, set this
checkpoint to `pending`, write the progress file, and end your turn. On
approval, set to `approved` and continue; on requested changes, route
back through the full fix cycle in order — Artificer (fix) → Sentinel
(tests for the fix, if the fix needs new or updated coverage) →
**Warden again (re-review is mandatory, not optional)** — and only
return to this Checkpoint once Warden's *updated* report is in hand.
Never bring a fix straight back to the developer for re-approval without
a fresh Warden pass in between; the step-9 Checkpoint relies on Warden's
report, not on Artificer's or Sentinel's say-so that the fix is good.
Leave the checkpoint `pending` for the entire cycle.

**Steps 10-11 — Deploy and monitoring (Quartermaster), or skip.** Before
delegating anything, check applicability yourself — this is the one
place this skill saves a full agent invocation rather than letting the
agent discover it can't do anything:
1. Re-read `questType` from `docs/quest-brief.md` (don't trust a stale
   cache here).
2. Read `.claude/quest-manifest.json`, find the `quartermaster` entry,
   check whether `questType` is in its `appliesTo` array.
3. **Not applicable** (currently `cli`/`script`, per the manifest —
   Quartermaster's own template independently states the same thing):
   set both step 10 and step 11 to `skipped`, with a note ("not
   applicable — questType not in quartermaster's appliesTo,
   `.claude/quest-manifest.json`"), and go straight to step 12. Do not
   invoke `quartermaster` just to have it tell you what the manifest
   already told you.
4. **Applicable**: delegate to `quartermaster` for step 10. On a
   successful deploy, set step 10 `done` and proceed to step 11
   (monitoring) — this is ongoing/best-effort rather than a single
   completed action; use your judgment on when it's reasonable to call
   it `done` for the purposes of this flow (e.g. after an initial
   healthy-healthcheck confirmation) versus leaving it `in-progress` if
   the developer wants continued watching.

**Step 12 — Final documentation (Scribe).** Delegate to `scribe`. On
completion, set step 12 to `done`. The Quest is complete; say so
plainly.

## Respecting gates that live inside the subagents
This skill's only gates are the two named Checkpoints. It does not add,
strengthen, weaken, or route around any subagent's own
`agent-recommended, human-confirmed` gate — most notably Quartermaster's
rollback and incident-response gates
(`.claude/agents/quartermaster.md`, "Stop-and-confirm gate"). When an
agent you delegated to stops mid-task to propose an action and wait for
confirmation, that is not a flow error to recover from: let its turn end
the same way it would if you'd invoked it directly, record the current
state in `.quest-progress.json` (e.g. step 10 `in-progress` with a note
that it's waiting on a rollback confirmation), and end your own turn too.
Never tell a subagent to "proceed anyway" on the developer's behalf, and
never treat "the flow is supposed to keep moving" as a reason to nudge
it past a gate the developer hasn't actually cleared.

## Before you finish (any step, any turn)
1. Write `.quest-progress.json` with the current state before ending
   your turn — not just after a full step, but any time you're about to
   stop for a Checkpoint or because a subagent gate fired.
2. State plainly which step you're on, what just happened, and — if you
   stopped — exactly what you're waiting for.
3. If you hit a gap this skill didn't anticipate (a subagent output in a
   shape this file didn't expect, a Quest type combination not covered
   above), apply the generalization test from `docs/spec.md` section 6:
   if it would recur for five unrelated Quests, log it in this Quest's
   `guild-proposals.md`; if it's specific to this Quest, note it inline
   and move on.
