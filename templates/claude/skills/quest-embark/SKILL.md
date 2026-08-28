---
name: quest-embark
description: >-
  Runs once per Quest, right at the start, to establish its foundation:
  Herald in Vision Mode (a deliberately incomplete Quest Brief plus a
  loose feature backlog), Loremaster's architecture design, a human
  Checkpoint approving both, and Artificer's scaffold — the first of
  three Quest-phase skills (AI/Agents Guild, "Orchestration model —
  three Quest-phase skills"). Tracks progress in
  `.quest-progress.json`'s `foundation` section. Use it to kick off a
  brand-new Quest from a loose idea, or to resume a foundation that
  hasn't reached `done` yet — it reads `.quest-progress.json` first and
  resumes from wherever the foundation stopped. Do not use it to write a
  Feature Brief or implement a feature (that's `/quest-forge <feature>`)
  and do not use it to deploy (that's `/quest-ship`). Do not re-run an
  already-`done`, Checkpoint-`approved` foundation without the developer
  explicitly asking to revisit it.
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
feature backlog, and a scaffold — it does not detail any feature (that's
`/quest-forge`) and it does not deploy (that's `/quest-ship`).

Sequence:
```
Ideation (developer) → Herald, Vision Mode → Loremaster → Checkpoint →
Artificer, scaffold only
```

It does not implement any step's actual work — every step's substance
lives in that step's own subagent template (`.claude/agents/<agent>.md`,
installed from this repository's `templates/claude/agents/`). This
skill's only job is: know what comes next, hand off to the right agent
with the right context, record what happened, and stop cleanly at the
one Checkpoint it owns.

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

## How the Checkpoint actually "pauses" — read this before anything else
There is no pause, callback, polling loop, or background process
anywhere in this flow. This skill's one Checkpoint is nothing more than
its instructions telling you, the assistant, to present the Quest Brief
and architecture and **end your turn** — the same way any response
ends. The "resume" happens because the developer sends a new message (in
this session or a future one), and this skill's instructions (loaded
fresh, or still active in context) pick the flow back up.
`.quest-progress.json` exists specifically so that pickup works
correctly even if the new message arrives in a session that never saw
the earlier turns — it is a plain state file on disk, read and written
like any other file, not a signal, event, or lock. Do not build,
suggest, or assume any additional mechanism for this.

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
three-phase model" — read that section in full before writing this file
for the first time. This skill only ever touches the top-level
`version`, `questType`, `updatedAt`, and `foundation` fields; it never
writes to `features` or `deploys` (initialized empty, and only ever
appended to by `/quest-forge` and `/quest-ship` respectively).

On a brand-new Quest, initialize:
```json
{
  "version": "2.0",
  "questType": null,
  "updatedAt": "<now, ISO 8601>",
  "foundation": { "status": "in-progress" },
  "features": [],
  "deploys": []
}
```
Fill in `questType` as soon as Herald's Quest Brief exists (its `Type`
field is the source of truth — cache it here for convenience, per the
AI/Agents Guild's rule that `docs/quest-brief.md` remains authoritative
if the two ever disagree). Update `foundation.status` to `done` and set
`foundation.checkpoint` to `approved`, with `foundation.completedAt`,
only once the Checkpoint below is actually approved — never earlier.

## Resuming — what to do on every invocation, before anything else
1. Look for `.quest-progress.json` at the Quest root.
2. **Missing** → this is a new Quest. If the invocation included an
   idea, that's Herald's input; proceed to Herald below and create the
   progress file as you go. If no idea was given and nothing in the
   conversation supplies one, ask for it — don't invent a starting
   point.
3. **Present, `foundation.status` already `done` and
   `foundation.checkpoint` already `approved`** → the foundation is
   complete. Say so plainly and point the developer at `/quest-forge
   <feature>` or `/quest-ship` instead of re-running this skill — do not
   silently redo Herald's Brief or Loremaster's design without the
   developer explicitly asking to revisit them.
4. **Present, `foundation` not yet `done`/`approved`** → resume at
   whichever of Herald / Loremaster / Checkpoint / Artificer hasn't
   completed yet, in that order. If the Checkpoint is pending, re-read
   `docs/quest-brief.md` and `docs/architecture.md` fresh and present
   them again rather than assuming the developer already saw them in a
   session your context doesn't actually share — a `/clear` or a new
   session means their context was wiped too, even if yours technically
   wasn't.

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
(see "A known gap" above). In Vision Mode Herald produces *two* files in
the same invocation, per that Guild's rules:
- `docs/quest-brief.md` — deliberately incomplete: overall vision,
  `type`, general app-level acceptance criteria, no feature-by-feature
  detail ("Quest Brief format — Vision Mode's output").
- `docs/feature-backlog.md` — a loose list of candidate features, one
  to two sentences each, each tagged `planned` / `in-progress` / `done`
  ("Feature backlog format — Vision Mode's second output").

On completion, capture `questType` from the resulting Quest Brief, write
the progress file, and proceed to Loremaster.

**Loremaster.** Delegate to the `loremaster` subagent. It reads
`docs/quest-brief.md` itself — you don't need to restate it. Explicitly
point it at the Architecture Guild's "Extensibility over premature
optimization at `/quest-embark`" rule when delegating: architecture is
being decided now, before any feature has a Feature Brief — only
`docs/feature-backlog.md`'s loose entries exist — so decisions must
favor extensibility over optimizing for whichever feature happens to be
best understood right now, and Loremaster must flag in
`docs/architecture.md` itself any decision that might need revisiting
once a specific backlog entry is later detailed. On completion, write
the progress file and proceed to the Checkpoint.

**Checkpoint (human).** Present a short summary of `docs/quest-brief.md`
and `docs/architecture.md` (not a re-paste of either in full — point at
the files), flag any deviations Loremaster called out (including any
extensibility risk it flagged for later revisiting), note the Checkpoint
as pending, write the progress file, and **end your turn**. On the
developer's next message: if they approve, set `foundation.checkpoint`
to `approved` and continue to Artificer in the same reply; if they ask
for changes, route back to Herald and/or Loremaster as appropriate,
leaving the Checkpoint unresolved.

**Artificer — scaffold only.** Delegate to `artificer`, pointed at the
now-approved Brief and architecture, and tell it explicitly that this
invocation is scaffold-only — no feature implementation happens here,
since no Feature Brief exists yet for anything in the backlog (Feature
Briefs are Feature Brief Mode's job, run later by `/quest-forge
<feature>`). On completion, set `foundation.status` to `done` and
`foundation.completedAt` to now.

## Respecting gates that live inside the subagents
This skill's only gate is the one Checkpoint above. It does not add,
strengthen, weaken, or route around any subagent's own
`agent-recommended, human-confirmed` gate. If a subagent stops mid-task
to propose an action and wait for confirmation, let its turn end the
same way it would if you'd invoked it directly, record the current state
in `.quest-progress.json`, and end your own turn too.

## Before you finish (any step, any turn)
1. Write `.quest-progress.json` with the current state before ending
   your turn — not just after a full step, but any time you're about to
   stop for the Checkpoint or because a subagent gate fired.
2. State plainly which step you're on, what just happened, and — if you
   stopped — exactly what you're waiting for.
3. Once `foundation` is `done` and its Checkpoint is `approved`, say so
   plainly and point the developer at `/quest-forge <feature>` to start
   detailing and building the first feature.
4. If you hit a gap this skill didn't anticipate, apply the
   generalization test from `docs/spec.md` section 6: if it would recur
   for five unrelated Quests, log it in this Quest's
   `guild-proposals.md`; if it's specific to this Quest, note it inline
   and move on.
