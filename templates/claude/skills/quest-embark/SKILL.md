---
name: quest-embark
description: >-
  Runs once per Quest, right at the start, to establish its foundation:
  Herald in Vision Mode (a deliberately incomplete Quest Brief plus a
  loose feature backlog), Loremaster's architecture design, and
  Artificer's scaffold — the first of three Quest-phase skills
  (AI/Agents Guild, "Orchestration model — three Quest-phase skills").
  Each of those three agents gets its own human Checkpoint immediately
  after it finishes (AI/Agents Guild, "Per-agent Checkpoints") — this
  skill never chains two agents together without stopping for approval
  in between. Tracks progress in `.quest-progress.json`'s `foundation`
  section, including a `steps` entry per agent. Use it to kick off a
  brand-new Quest from a loose idea, or to resume a foundation that
  hasn't reached `done` yet — it reads `.quest-progress.json` first and
  resumes from wherever the foundation stopped, including mid-Checkpoint.
  Do not use it to write a Feature Brief or implement a feature (that's
  `/quest-forge <feature>`) and do not use it to deploy (that's
  `/quest-ship`). Do not re-run an already-`done` foundation without the
  developer explicitly asking to revisit it.
argument-hint: "[one-paragraph idea for a new Quest, or nothing to resume]"
---

# Quest Embark — Quest foundation orchestrator

## Naming note
This skill is invoked as `/quest-embark`, not `/embark` or `/quest`. In
Claude Code, a project skill's slash-command name comes from its
directory name (`.claude/skills/<dir>/SKILL.md` → `/<dir>`), not from
this file's `name:` frontmatter — that field only sets the display label
shown in skill listings. This is the same rule the retired `/quest-flow`
skill's own "Naming note" documented, and the same rule `/quest-forge`'s
and `/quest-ship`'s own SKILL.md files restate for themselves. Keep the
directory name `quest-embark` if this file is ever moved or copied.

## Purpose and scope
This skill orchestrates the first of three Quest-phase skills the
AI/Agents Guild defines ("Orchestration model — three Quest-phase
skills"): `/quest-embark` (this one, once per Quest), `/quest-forge
<feature>` (repeatable, once per feature), and `/quest-ship` (repeatable,
on demand). This skill's job ends the moment the Quest has a
Checkpoint-approved Quest Brief, a Checkpoint-approved architecture, a
feature backlog, and a Checkpoint-approved scaffold — it does not detail
any feature (that's `/quest-forge`) and it does not deploy (that's
`/quest-ship`).

Sequence:
```
Ideation (developer) → Herald, Vision Mode → Checkpoint →
Loremaster → Checkpoint → Artificer, scaffold only → Checkpoint
```

Every one of those three Checkpoints is a full stop, per the AI/Agents
Guild's "Per-agent Checkpoints": this skill never hands off from one
agent to the next, and never marks `foundation.status` as `done`, without
the developer explicitly approving the step that just finished. There is
no shortcut where two agents run back to back inside one turn.

It does not implement any step's actual work — every step's substance
lives in that step's own subagent template (`.claude/agents/<agent>.md`,
installed from this repository's `templates/claude/agents/`). This
skill's only job is: know what comes next, hand off to the right agent
with the right context, record what happened, and stop cleanly at every
Checkpoint it owns — three of them now, not one.

**A known gap this skill inherits, not introduces**: the `herald`,
`loremaster`, and `artificer` subagent templates
(`.claude/agents/herald.md`, `loremaster.md`, `artificer.md`) still
describe themselves in terms of the retired step-numbered flow ("step
2", "step 3", "step-4 Checkpoint", "step 5") — they have not yet been
rewritten for the three-phase model. Until they are, this skill briefs
each subagent explicitly with the current model's terms when delegating
(named below, at each step) rather than assuming the subagent's own
template text is current. This is a real, acknowledged gap — not
something to silently paper over — and belongs in guildhall's own
`guild-proposals.md` (root of this repository) as a candidate to update
the seven agent templates for the three-phase model, the same way the
Guilds themselves already have been.

## How a Checkpoint actually "pauses" — read this before anything else
There is no pause, callback, polling loop, or background process
anywhere in this flow. Every one of this skill's three Checkpoints —
after Herald, after Loremaster, after Artificer (AI/Agents Guild,
"Per-agent Checkpoints") — is nothing more than an instruction telling
you, the assistant, to present that agent's report and **end your
turn** — the same way any response ends. The "resume" happens because
the developer sends a new message (in this session or a future one), and
this skill's instructions (loaded fresh, or still active in context)
pick the flow back up. `.quest-progress.json` exists specifically so
that pickup works correctly even if the new message arrives in a session
that never saw the earlier turns — it is a plain state file on disk,
read and written like any other file, not a signal, event, or lock. Do
not build, suggest, or assume any additional mechanism for this — not
even a "lighter" one for the two Checkpoints this skill only recently
gained (after Herald, after Artificer). All three work identically.

Herald's Vision Mode intake round (Product/Ideation Guild, "Vision Mode
intake") uses this exact same mechanism, one step earlier still — it is
not a Checkpoint (that term stays reserved for approving an agent's
*finished* work, per "Per-agent Checkpoints"), just the same "ask, then
end the turn" pattern applied to Herald's six questions *before* it
drafts anything. Treat it identically at the mechanism level: no pause
primitive, just ending the turn after asking and picking back up on the
developer's next message — but do not confuse it with Herald's own
Checkpoint immediately afterward, which reviews the Brief and backlog
Herald produces *once it has* drafted them.

## Prerequisites
This skill assumes these already exist inside the Quest's own
repository, copied there from this guildhall checkout:
1. The Herald, Loremaster, and Artificer subagent templates, at
   `.claude/agents/herald.md`, `loremaster.md`, and `artificer.md`.
2. This file, at `.claude/skills/quest-embark/SKILL.md`.

If either is missing where expected, say so plainly and ask the
developer where these files actually live for this Quest, rather than
guessing a path or silently skipping a step.

## The progress file — `.quest-progress.json`
Lives at the Quest root, next to `docs/quest-brief.md`. Schema defined
by the AI/Agents Guild, "`.quest-progress.json` — schema for the
three-phase model" (see also "Per-agent Checkpoints") — read both in
full before writing this file for the first time. This skill only ever
touches the top-level `version`, `questType`, `updatedAt`, and
`foundation` fields; it never writes to `features` or `deploys`
(initialized empty, and only ever appended to by `/quest-forge` and
`/quest-ship` respectively).

On a brand-new Quest, initialize:
```json
{
  "version": "3.0",
  "questType": null,
  "updatedAt": "<now, ISO 8601>",
  "foundation": {
    "status": "in-progress",
    "steps": {
      "herald": { "status": "pending", "checkpoint": "pending" },
      "loremaster": { "status": "pending", "checkpoint": "pending" },
      "artificer": { "status": "pending", "checkpoint": "pending" }
    }
  },
  "features": [],
  "deploys": []
}
```
Fill in `questType` as soon as Herald's Quest Brief exists (its `Type`
field is the source of truth — cache it here for convenience, per the
AI/Agents Guild's rule that `docs/quest-brief.md` remains authoritative
if the two ever disagree). As each agent finishes, set its
`steps.<agent>.status` to `done` and present its Checkpoint; only set
`steps.<agent>.checkpoint` to `approved` once the developer actually
approves that specific Checkpoint — never earlier, never for an agent
that hasn't run yet. Set `foundation.status` to `done` and
`foundation.completedAt` to now only once **all three** entries in
`foundation.steps` read `{ "status": "done", "checkpoint": "approved" }`
— that's Artificer's Checkpoint, not Artificer merely finishing.

## Resuming — what to do on every invocation, before anything else
1. Look for `.quest-progress.json` at the Quest root.
2. **Missing** → this is a new Quest. If the invocation included an
   idea, that's Herald's input; proceed to Herald below and create the
   progress file as you go. If no idea was given and nothing in the
   conversation supplies one, ask for it — don't invent a starting
   point.
3. **Present, `foundation.status` already `done`** → the foundation is
   complete (which, per the schema above, already means every step's
   Checkpoint was approved). Say so plainly and point the developer at
   `/quest-forge <feature>` or `/quest-ship` instead of re-running this
   skill — do not silently redo Herald's Brief, Loremaster's design, or
   Artificer's scaffold without the developer explicitly asking to
   revisit them.
4. **Present, `foundation.status` not yet `done`** → find the first
   entry in `foundation.steps` (in order: `herald`, `loremaster`,
   `artificer`) that isn't `{ "status": "done", "checkpoint": "approved"
   }`, and resume exactly there:
   - `status: "pending"` → that agent hasn't run yet; delegate to it.
   - `status: "done"`, `checkpoint: "pending"` → that agent already
     finished and is waiting on its own Checkpoint. Re-read its output
     fresh (`docs/quest-brief.md` and/or `docs/feature-backlog.md` for
     Herald, `docs/architecture.md` for Loremaster, the scaffold's own
     summary for Artificer) and present it again rather than assuming
     the developer already saw it in a session your context doesn't
     actually share — a `/clear` or a new session means their context
     was wiped too, even if yours technically wasn't. End your turn.
   The same caution applies one step earlier than Herald's own
   Checkpoint: if `docs/quest-brief.md` doesn't exist yet and your
   current context doesn't already contain Herald's six-point intake
   questions and the developer's answers to them (e.g. this is a fresh
   session resuming mid-intake), delegate to Herald and have it
   (re-)ask the intake round rather than guessing that the developer's
   next message answers questions it never actually saw asked in this
   context.

## Step-by-step orchestration

**Ideation.** If the developer hasn't given you an idea yet (a loose,
2-3-sentence description of what they want to build), ask for it before
doing anything else — this is not an agent invocation, just the
developer's own message.

**Herald — Vision Mode.** Delegate to the `herald` subagent. Brief it
explicitly, in your delegation, that it is running in **Vision Mode**
(Product/Ideation Guild, "Herald's two modes: Vision Mode and Feature
Brief Mode") — its own template text still describes a single-mode,
step-numbered Herald and hasn't been updated for this distinction yet
(see "A known gap" above). Also brief it explicitly, every time, that
before drafting anything it must run the Product/Ideation Guild's
"Vision Mode intake — a fixed round of questions before drafting": ask
the developer all six points (problem/audience, type, v1 boundaries,
definition of done, known constraints, explicit non-goals) as a single
short numbered list, then end your turn and wait for the developer's
answers before Herald writes a single line of `docs/quest-brief.md` or
`docs/feature-backlog.md` — herald.md's own text still says "never a
full intake form," which described the old ambiguity-only default this
Guild rule now supersedes for Vision Mode specifically; this delegation
brief is what overrides that stale line until the template itself is
rewritten (same known gap as above). Once the developer answers, resume
in the same reply. In Vision Mode Herald produces *two* files in the
same invocation, per that Guild's rules:
- `docs/quest-brief.md` — deliberately incomplete: overall vision,
  `type`, general app-level acceptance criteria, no feature-by-feature
  detail ("Quest Brief format — Vision Mode's output").
- `docs/feature-backlog.md` — a loose list of candidate features, one
  to two sentences each, each tagged `planned` / `in-progress` / `done`
  ("Feature backlog format — Vision Mode's second output").

On completion, capture `questType` from the resulting Quest Brief, set
`foundation.steps.herald.status` to `done`, write the progress file, and
proceed to Herald's own Checkpoint below — do not proceed to Loremaster
in the same reply.

**Checkpoint (Herald).** Present a short summary of `docs/quest-brief.md`
and `docs/feature-backlog.md` (not a re-paste of either in full — point
at the files), flag anything Herald logged under "Open questions /
assumptions" (including a `type` conflict against `.guildhall-lock.json`,
per the Product/Ideation Guild), note `foundation.steps.herald.checkpoint`
as `pending`, write the progress file, and **end your turn**. On the
developer's next message: if they approve, set that field to `approved`
and proceed to Loremaster in the same reply; if they ask for changes,
route back to Herald (which may mean re-running its intake round, if the
requested change traces back to one of the six points) and leave the
Checkpoint unresolved.

**Loremaster.** Delegate to the `loremaster` subagent, only after
Herald's Checkpoint above is `approved`. It reads `docs/quest-brief.md`
itself — you don't need to restate it. Explicitly point it at the
Architecture Guild's "Extensibility over premature optimization at
`/quest-embark`" rule when delegating: architecture is being decided
now, before any feature has a Feature Brief — only
`docs/feature-backlog.md`'s loose entries exist — so decisions must
favor extensibility over optimizing for whichever feature happens to be
best understood right now, and Loremaster must flag in
`docs/architecture.md` itself any decision that might need revisiting
once a specific backlog entry is later detailed. On completion, set
`foundation.steps.loremaster.status` to `done`, write the progress file,
and proceed to Loremaster's own Checkpoint below — do not proceed to
Artificer in the same reply.

**Checkpoint (Loremaster).** Present a short summary of
`docs/architecture.md` (point at the file, don't re-paste it), flag any
deviation from the Architecture/Data Guild defaults Loremaster called
out (including any extensibility risk it flagged for later revisiting),
note `foundation.steps.loremaster.checkpoint` as `pending`, write the
progress file, and **end your turn**. On the developer's next message: if
they approve, set that field to `approved` and proceed to Artificer in
the same reply; if they ask for changes, route back to Loremaster (or to
Herald first, if the requested change actually traces back to the Brief)
and leave the Checkpoint unresolved.

**Artificer — scaffold only.** Delegate to `artificer`, only after
Loremaster's Checkpoint above is `approved`, pointed at the now-approved
Brief and architecture, and tell it explicitly that this invocation is
scaffold-only — no feature implementation happens here, since no
Feature Brief exists yet for anything in the backlog (Feature Briefs are
Feature Brief Mode's job, run later by `/quest-forge <feature>`). On
completion, set `foundation.steps.artificer.status` to `done`, write the
progress file, and proceed to Artificer's own Checkpoint below.

**Checkpoint (Artificer).** Present a short summary of what Artificer
scaffolded (structure, configs, CI/CD base — point at the actual files
changed, don't re-paste them), note
`foundation.steps.artificer.checkpoint` as `pending`, write the progress
file, and **end your turn**. On the developer's next message: if they
approve, set that field to `approved`, set `foundation.status` to `done`
and `foundation.completedAt` to now, in the same reply; if they ask for
changes, route back to Artificer and leave the Checkpoint unresolved —
`foundation.status` stays `in-progress` until this Checkpoint clears,
even though Artificer itself already finished running.

## Respecting gates that live inside the subagents
This skill's own gates are the three per-agent Checkpoints above — it
does not add, strengthen, weaken, or route around any subagent's own
`agent-recommended, human-confirmed` gate on top of them. If a subagent
stops mid-task to propose an action and wait for confirmation, let its
turn end the same way it would if you'd invoked it directly, record the
current state in `.quest-progress.json`, and end your own turn too.

## Before you finish (any step, any turn)
1. Write `.quest-progress.json` with the current state before ending
   your turn — not just after a full step, but any time you're about to
   stop for a Checkpoint or because a subagent gate fired.
2. State plainly which agent's step you're on, what just happened, and —
   if you stopped — exactly what you're waiting for (a Checkpoint
   approval, an intake answer, or a subagent's own confirmation gate).
3. Once `foundation.status` is `done` — meaning all three Checkpoints
   (Herald, Loremaster, Artificer) are `approved`, not merely that all
   three agents ran — say so plainly and point the developer at
   `/quest-forge <feature>` to start detailing and building the first
   feature.
4. If you hit a gap this skill didn't anticipate, apply the
   generalization test from `docs/spec.md` section 6: if it would recur
   for five unrelated Quests, log it in this Quest's
   `guild-proposals.md`; if it's specific to this Quest, note it inline
   and move on.
