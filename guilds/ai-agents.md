# AI/Agents Guild

> Applies to: all Quests
> Status: active

## Purpose
Every other Guild defines a standard for the Quest itself — code, tests,
infrastructure, data. This Guild is different: it defines how the agents
invoked across the Quest-phase skills (master spec, section 5; see
"Orchestration model — three Quest-phase skills" below for the three
skills themselves) are supposed to behave while consuming and applying
those standards — what each agent role can decide alone, when a proposed
action needs a human's explicit go-ahead, when a new pattern belongs in
`guild-proposals.md`, and what to do when the Guild an agent needs isn't
finished yet. It formalizes practices that were already happening
informally across the other seven Guilds before this one existed.
Consulted by every agent, at every phase of that model — not just one.

## Rules

### Orchestration model — three Quest-phase skills
The development flow this Guild's other rules assume (Purpose, above) is
no longer one linear twelve-step sequence run by a single skill. It's
three independently invocable skills, each covering a self-contained
phase, each living in its own directory under
`templates/claude/skills/` — `/quest-embark`, `/quest-forge`,
`/quest-ship`. As with the skill this model replaces, a skill's
slash-command name comes from its *directory* name
(`templates/claude/skills/<dir>/SKILL.md` → `/<dir>`), never from the
file's own `name:` frontmatter field — the same rule the retired
`/quest-flow` skill's own "Naming note" already documented.

- **`/quest-embark`** — once per Quest. Herald writes a Quest Brief that
  is *deliberately* incomplete (it states the app's vision, not every
  feature in detail) plus a loose backlog of candidate features at
  `docs/feature-backlog.md` (each entry tagged `planned` / `in-progress`
  / `done`); Loremaster designs the architecture; Artificer scaffolds the
  repository (structure, CI/CD, base config). A human Checkpoint follows
  every one of those three agents, not just Loremaster's — see "Per-agent
  Checkpoints" below. Ends with a Quest ready to receive features, not a
  Quest with every feature already planned in detail.
- **`/quest-forge <feature>`** — repeatable, once per feature, as many
  times as the backlog needs. Herald writes a Feature Brief for *only*
  that feature at `docs/features/<slug>.md` — a file that does not exist
  before this invocation; Artificer implements it; Sentinel tests it;
  Warden reviews it. Ends the turn presenting the result. This
  introduces no new pause *mechanism* — it reuses the principle the
  retired `/quest-flow` skill already established: the skill ends its
  turn, and resuming is the developer sending the next message, not any
  kind of callback, poll, or background process — but it now applies that
  mechanism after every one of those four agents, not just at the very
  end (see "Per-agent Checkpoints" below).
- **`/quest-ship`** — repeatable, on demand. Does not wait for the whole
  backlog to reach `done`; it publishes whatever is ready as of that
  invocation. Each run: a Checkpoint reviews everything built since the
  last deploy and decides the deploy's scope *before* any agent acts,
  Quartermaster deploys and monitors, and Scribe writes an *incremental*
  documentation update — never a single "final documentation" pass, since
  further `/quest-ship` runs may still follow. Quartermaster and Scribe
  each get their own Checkpoint too, once their work is done (below) —
  distinct from the pre-deploy one, which reviews scope before either of
  them has run.

**The human Checkpoint now happens after every agent's own step, in every
one of the three skills** — not at two fixed points the way the retired
step-9-and-only-step-9 model worked, and not at the two *kinds* of point
this Guild described in an earlier revision (end of `/quest-embark`,
every `/quest-ship` run). That description undercounted: every agent
invocation across all three skills gets its own Checkpoint now. See "Per-
agent Checkpoints" immediately below for the rule itself; this paragraph
only exists so a reader who remembers the old two-point description knows
it's superseded, not to restate the rule twice.

### Per-agent Checkpoints — a human approval after every step, in every skill
Before this rule, an agent finishing its work and handing off to the next
one happened automatically inside a skill invocation — only
`/quest-embark`'s combined Brief+architecture review and `/quest-ship`'s
pre-deploy scope review paused for a human at all; `/quest-forge` never
did. In practice this meant several agents' reports could go by inside a
single long turn, with the next agent already acting on the previous
one's output before a human had a real chance to read it — a report
"getting lost" in a large conversation instead of getting reviewed.
Evidence: developer feedback, 2026-08-30.

**The rule**: whenever *any* named agent (Herald, Loremaster, Artificer,
Sentinel, Warden, Quartermaster, Scribe) finishes its work and produces
its report or output, in *any* of the three Quest-phase skills, the
orchestrating skill presents that report and **ends its turn** — the
same no-pause-primitive mechanism every Checkpoint in this project has
always used (a plain instruction to stop and wait, nothing else). It does
not hand off to whatever agent would run next, and it does not advance
that phase's/feature's/deploy's `status` past what that agent just
completed, until the developer's next message approves it. This applies
with no exceptions:
- **Every handoff between agents**, in every skill — Herald → Loremaster,
  Loremaster → Artificer, Herald → Artificer → Sentinel → Warden, and
  Quartermaster → Scribe all now pause where they previously ran straight
  through.
- **The fix-retry cycle inside `/quest-forge`**: when Warden flags
  something, the resulting Artificer (fix) → Sentinel (re-test) → Warden
  (re-review) cycle gets a Checkpoint after each of those steps too, the
  same as the first pass — not a special unattended loop. A feature can
  legitimately pass through several Checkpoints before Warden's review
  comes back clean.
- **The last agent in a skill**: Artificer's scaffold (`/quest-embark`),
  Warden's review (`/quest-forge`), and Scribe's update (`/quest-ship`)
  each still get an explicit Checkpoint of their own. A phase's, feature's,
  or deploy's `status` only becomes `done` once that last Checkpoint is
  actually approved — not the moment the agent finishes running, even
  though the skill's turn was already going to end there regardless.

**Two different reasons a turn ends, not to be confused**: this rule
governs *post*-work Checkpoints — reviewing what an agent just finished,
before anything proceeds from it. It is a different thing from a *pre*-
work pause like Herald's Vision Mode intake round (Product/Ideation
Guild, "Vision Mode intake") or `/quest-ship`'s pre-deploy scope
Checkpoint (which reviews *what to include* before Quartermaster has done
anything yet) — those ask for input or a decision before an agent acts.
Both kinds get called "Checkpoint" and both use the identical end-the-
turn mechanism, but they sit at different points in an agent's work for
different reasons; a pre-work Checkpoint is not a substitute for the
post-work one that agent's own completed output still needs.
`/quest-embark`'s old combined "Brief + architecture" Checkpoint is
retired by this rule, not layered under it — it's replaced by two
separate post-work Checkpoints, one after Herald and one after
Loremaster, both narrower and both still reviewed before Artificer starts
either way. `/quest-ship`'s pre-deploy scope Checkpoint is unchanged and
keeps its place before Quartermaster; this rule only adds the two
Checkpoints after Quartermaster and after Scribe that didn't exist
before.

**What counts as approval**: a plain go-ahead from the developer, or an
explicit request for changes that routes back to the agent that needs to
redo something (which may be the one that just finished, or an earlier
one, if the issue traces upstream). Never inferred from silence or from
the developer moving on to a different topic — the same standing rule
every Checkpoint in this project already carries.

**Each step's own state, not a retry history**: a step's `status`/
`checkpoint` pair (schema below) reflects that agent's most recent pass
for this phase/feature/deploy — a fix-retry cycle overwrites the previous
pass's recorded state rather than accumulating one entry per attempt.
This project's other progress-tracking fields already stay this lean
(no per-attempt history anywhere else in `.quest-progress.json`); a full
retry history is a `guild-proposals.md` candidate only if a real Quest
turns out to need one, not assumed necessary now.
> Enforcement: agent-reviewed — a script can check that every
> `steps.<agent>.checkpoint` in `.quest-progress.json` reached `approved`
> before that entry's `status` (or the phase/feature/deploy's own
> `status`) advanced past it, the same mechanical shape the retired
> two-point Checkpoint rule already had. Recognizing that a fix-retry
> cycle re-enters this same rule at each loop, not only on a feature's
> first pass through Artificer/Sentinel/Warden, is a judgment call.

### `.quest-progress.json` — schema for the three-phase model
Replaces the single linear `steps` map the retired `/quest-flow` skill
used. Three top-level sections, matching the three skills' own
cardinality — one runs once, one grows per feature, one grows per
deploy — and, since "Per-agent Checkpoints" above, each of those three
also carries a `steps` object of its own tracking every named agent that
phase/feature/deploy involves, individually:

```json
{
  "version": "3.0",
  "questType": "web-app",
  "updatedAt": "2026-08-30T00:00:00Z",
  "foundation": {
    "status": "done",
    "steps": {
      "herald": { "status": "done", "checkpoint": "approved" },
      "loremaster": { "status": "done", "checkpoint": "approved" },
      "artificer": { "status": "done", "checkpoint": "approved" }
    },
    "completedAt": "2026-08-20T00:00:00Z"
  },
  "features": [
    {
      "slug": "user-auth",
      "brief": "docs/features/user-auth.md",
      "status": "done",
      "forgedAt": "2026-08-22T00:00:00Z",
      "steps": {
        "herald": { "status": "done", "checkpoint": "approved" },
        "artificer": { "status": "done", "checkpoint": "approved" },
        "sentinel": { "status": "done", "checkpoint": "approved" },
        "warden": { "status": "done", "checkpoint": "approved" }
      }
    },
    {
      "slug": "password-reset",
      "brief": "docs/features/password-reset.md",
      "status": "in-progress",
      "forgedAt": "2026-08-24T00:00:00Z",
      "steps": {
        "herald": { "status": "done", "checkpoint": "approved" },
        "artificer": { "status": "done", "checkpoint": "approved" },
        "sentinel": { "status": "in-progress", "checkpoint": "pending" },
        "warden": { "status": "pending", "checkpoint": "pending" }
      }
    }
  ],
  "deploys": [
    {
      "deployedAt": "2026-08-23T00:00:00Z",
      "checkpoint": "approved",
      "steps": {
        "quartermaster": { "status": "done", "checkpoint": "approved" },
        "scribe": { "status": "done", "checkpoint": "approved" }
      },
      "featuresIncluded": ["user-auth"],
      "note": "first ship — password-reset not yet forged at this point"
    }
  ]
}
```

- **`foundation`** — written once, by `/quest-embark`. Overall `status`
  follows the same `pending` / `in-progress` / `done` vocabulary the
  retired `steps` map used, and only reaches `done` once every entry in
  `foundation.steps` reaches `{ "status": "done", "checkpoint":
  "approved" }` (Per-agent Checkpoints, above) — `artificer` included,
  since its scaffold's own Checkpoint is what actually closes out the
  phase now, not the agent merely finishing.
- **`features`** — an array, one entry appended per `/quest-forge
  <feature>` invocation, never removed or overwritten by a later run
  against a different feature. `slug` matches the feature's
  `docs/features/<slug>.md` filename (Herald decides the slug when it
  writes that Brief — see "Standard agent output locations" below).
  `status` tracks that one feature's own implementation/test/review
  cycle, independent of every other entry in the array, and — same rule
  as `foundation` — only reaches `done` once every entry in that
  feature's own `steps` reaches `{ "status": "done", "checkpoint":
  "approved" }`.
- **`deploys`** — an array, one entry appended per `/quest-ship`
  invocation. Top-level `checkpoint` is the pre-deploy *scope* Checkpoint
  — approving which features go in *before* Quartermaster acts — kept
  distinct from the two per-agent Checkpoints inside `steps`, which
  approve Quartermaster's and Scribe's completed work *after* each runs.
  `featuresIncluded` records which `features[].slug` values were part of
  *that* deploy — since `/quest-ship` runs on demand rather than waiting
  for the full backlog, this is the only record of which features
  actually shipped together in a given release, and it does not
  retroactively include features forged after that deploy already ran.
- **Every `steps.<agent>` entry** — `{ "status": "pending" | "in-
  progress" | "done", "checkpoint": "pending" | "approved" }`. Reflects
  that agent's most recent pass only, not a history of every attempt —
  see "Per-agent Checkpoints" above for why a fix-retry cycle overwrites
  rather than appends. `checkpoint` follows the same rule the retired
  schema already had for its one `checkpoint` field: never `approved`
  except by an explicit developer confirmation, never inferred from
  silence or from the developer moving on to another topic.
> Enforcement: agent-reviewed — matches the enforcement posture the
> retired schema's own rules carried; no script currently validates this
> file's shape against the schema above.

### Agent roles and decision authority
Each named agent from the Quest-phase skills (see "Orchestration model"
above) consults specific Guilds and has a bounded authority — decisions
within its Guilds' rules are its own to make; decisions that deviate from
those rules, or that reach outside its own skill invocation, are not.

- **Product** (Herald — `/quest-embark`'s Quest Brief, and every
  `/quest-forge <feature>`'s Feature Brief; Product/Ideation Guild) —
  decides how to structure and phrase whichever brief it is currently
  writing. Does not decide whether the Quest gets built at all — that's
  the human's call at ideation and confirmed again at `/quest-embark`'s
  Checkpoint — nor which feature gets forged next, since that's the
  developer's choice of what to invoke `/quest-forge` on, not Herald's
  call. This includes the `type` value already fixed in
  `.guildhall-lock.json` at `init`, ahead of `/quest-embark` — see the
  Product/Ideation Guild's "`type` as a default to confirm, not a
  decision made from scratch" for the full rule.
- **Architect** (Loremaster — `/quest-embark`; Architecture + Data Guild)
  — decides structural choices within those Guilds' defaults, including
  whether the Quest needs a database and, when Herald's intake flagged
  one, the mocking strategy for an external dependency (Architecture
  Guild, "External dependencies — mocking and the integration
  contract"). Does not decide to deviate from the Architecture Guild's
  default stack, or its default mocking strategy, without explicitly
  flagging the deviation for `/quest-embark`'s Checkpoint.
- **Builder** (Artificer — `/quest-embark`'s scaffold, and every
  `/quest-forge <feature>`'s implementation; Code Style + Ops/Infra +
  Security Guild) — decides implementation details within those Guilds'
  rules, following the lib-first-then-UI split (spec section 5) within
  whichever feature it's currently implementing. Does not decide to add a
  dependency without the one-sentence justification the Security Guild
  requires, and does not decide to restructure folders against the
  Architecture Guild.
- **QA** (Sentinel — `/quest-forge <feature>`; Testing/QA Guild) —
  decides which specific scenarios that feature's test suite covers.
  Does not decide to skip the error/edge-case requirement or ship below
  the coverage threshold.
- **Reviewer** (Warden — `/quest-forge <feature>`; Security + Code Style
  checklist, including the language check) — decides what to flag for
  that feature. Does not decide to wave through a blocking CI failure as
  part of approval.
- **Ops** (Quartermaster — `/quest-ship`; Ops/Infra + Monitoring Guild) —
  decides routine deploys that pass every blocking check. Does not
  decide, alone, to execute a rollback or any other high-impact
  production action — see the general rule below.
- **Docs** (Scribe — `/quest-ship`; Documentation Guild — still draft) —
  decides how to write up the incremental update for what changed since
  the last `/quest-ship` run, within whatever the Documentation Guild
  settles on once it's active.
> Enforcement: agent-reviewed — this is a judgment boundary, not a
> mechanical check; the Reviewer agent and the human Checkpoints are the
> backstop when an agent oversteps it.

### Standard agent output locations
Cross-cutting, one level below "Agent roles and decision authority"
above: not *what* an agent decides, but *where* its output lives once
decided. Before this section existed, no Guild named a single answer for
this — calculator-quest, step 3 (Loremaster) used `docs/architecture.md`
by its own convention, with no Guild to point at for that choice. Rather
than fixing that one step in isolation, this section is the single place
every agent's output location is tracked, so the next gap of the same
shape (a new agent, or a step whose output location hasn't been decided
yet) has an obvious table row to add instead of another one-off Quest
convention.

| Agent (codename) | Role / skill | Output location | Defined by |
|---|---|---|---|
| Herald | Product, `/quest-embark` | `docs/quest-brief.md` | Product/Ideation Guild, "Quest Brief format" |
| Herald | Product, `/quest-embark` | `docs/feature-backlog.md` | This row — formalized here as part of the three-phase orchestration model. Evidence: process change following calculator-quest retrospective, 2026-08-25. |
| Herald | Product, `/quest-forge <feature>` | `docs/features/<slug>.md` — does not exist before that feature's `/quest-forge` invocation | This row — same evidence as above |
| Loremaster | Architect, `/quest-embark` | `docs/architecture.md` | This row — formalized here; evidence: calculator-quest, step 3 (Loremaster). See the Architecture Guild's Purpose for the cross-reference back to this section. |
| Loremaster | Architect, `/quest-embark` | `docs/integration-contract.md` — skeleton only; only written at all when Herald's intake flagged an external dependency | Architecture Guild, "External dependencies — mocking and the integration contract" |
| Artificer | Builder, `/quest-embark` (scaffold) + `/quest-forge <feature>` (implementation) | The Quest's own source tree (scaffold + feature code) — not a single file | Architecture Guild, "Folder structure" |
| Artificer | Builder, `/quest-embark` (scaffold) + `/quest-forge <feature>` (per-feature updates) | `mocks/` (fixture data) and incremental entries in `docs/integration-contract.md` — only when this Quest has an external dependency | Architecture Guild, "External dependencies — mocking and the integration contract" |
| Sentinel | QA, `/quest-forge <feature>` | Test files co-located with the source they test (`*.test.ts` / `*.test.tsx`) | Testing/QA Guild, "File organization" |
| Warden | Reviewer, `/quest-forge <feature>` | Not yet standardized — a real gap, not a conscious decision | — |
| Quartermaster | Ops, `/quest-ship` | Deploys are an action, not a written artifact. A post-incident write-up, when one is warranted, goes to `/docs/incidents/YYYY-MM-DD-short-title.md` | Documentation Guild, "Post-incident documentation" |
| Scribe | Docs, `/quest-ship` | `README.md` at the Quest root, plus `/docs/adr/NNNN-short-title.md` for any ADR a given run warrants — updated incrementally on every `/quest-ship` run, never written as a single final pass | Documentation Guild, "README format" / "ADR format" |

- A row with a "Defined by" Guild is not this Guild's rule to restate —
  it's a pointer to where the actual requirement (format, required
  sections, when the file is written) lives; this table only answers
  *where*, never re-derives *what* goes in it.
- A row marked "not yet standardized" is the same kind of honestly-
  labeled gap this Guild's own "Out of scope" section already uses
  elsewhere — worth a `guild-proposals.md` entry once a real Quest
  surfaces a concrete need for it (per "Logging a `guild-proposals.md`
  entry" below), not guessed at now.
- Any other Guild that needs to reference where a given agent's output
  lives points back to this table instead of restating the path —
  exactly the pattern the Architecture Guild's "Persistence decisions"
  section now follows for the Architect/Loremaster row.
> Enforcement: agent-reviewed — a script could check that a Quest's
> `docs/quest-brief.md`, `docs/feature-backlog.md`, and
> `docs/architecture.md` exist by the end of `/quest-embark`, and that a
> `docs/features/<slug>.md` exists before that feature's `/quest-forge`
> run is considered complete, but whether an agent chose the *right*
> location for output this table doesn't yet cover is a judgment call
> until that row is filled in.

### When to apply `agent-recommended, human-confirmed`
The tag already appears twice — the Ops/Infra Guild's rollback and the
Monitoring Guild's incident response — always in the same shape: an
agent detects something and proposes an action, but doesn't execute it
alone. Any agent must apply this same tag to a newly proposed action,
even one not yet written into any specific Guild, whenever **both** are
true:
1. The action has a direct effect outside the development/preview
   environment — production data, a live deployment, a real external
   service, money, or anything a real user currently depends on.
2. The action isn't fully undoable by a further automated step alone — a
   human would need to notice something went wrong before it could be
   corrected.
If both hold, the agent states the action and its reasoning, then stops
— it does not execute until a human confirms. If only one holds (e.g.
reversible but production-facing, or irreversible but confined to a
preview/dev environment), the action is `agent-reviewed` instead: the
confirmation gate is reserved for the intersection of impact and
irreversibility, not applied by default to anything that merely sounds
risky.
> Enforcement: agent-reviewed — the two conditions are meant to make the
> classification a checklist rather than a vibe, but applying them is
> still a judgment call.

### Editing an active Guild is `agent-recommended, human-confirmed`
Rewriting or editing a Guild file that is `status: active` meets the same
two-condition test above, even though the "environment" here is the
guildhall repository rather than a Quest's production system: an active
Guild is consumed by every future Quest that runs `init` (impact well
beyond the task at hand), and a mistake in it isn't cleanly reversible —
a Quest that already ran `init` has no way to know the rule changed until
someone runs `update` (spec section 7). An agent must not rewrite an
active Guild unilaterally as a side effect of some other task; it
proposes the change and why, and a human confirms before it's committed.
This does **not** apply to the interactive Guild-authoring process this
repository already follows — prompt describing the change, draft
produced, human reviews and asks for revisions, human approves the
commit — since that process already satisfies the same intent through
its own back-and-forth. The rule exists for the case that process doesn't
cover: an agent editing an active Guild file on its own initiative,
outside that loop, in the middle of unrelated work.
> Enforcement: agent-recommended, human-confirmed — outside the
> established interactive authoring process; that process itself already
> satisfies the gate.

### Logging a `guild-proposals.md` entry
Use the master spec's own generalization test (section 3), reworded for
a decision made mid-Quest: *if 5 completely different Quests hit this
same situation, would the same rule apply to all of them?*
- **Yes** → it's a candidate Guild rule. Log it in `guild-proposals.md`
  using the format in spec section 6, even without certainty it'll be
  accepted — capture is automatic and cheap; promotion is human and
  deliberate (spec section 6's stated principle).
- **No** (the rule only makes sense because of something specific to
  this Quest — its data, its scale, its audience) → it's a Quest-specific
  decision. Document it inline instead (a code comment only if the WHY
  is non-obvious, per the Code Style Guild) — not in
  `guild-proposals.md`.
- A proposal doesn't have to be a brand-new idea. Filling a gap a Guild
  already flagged as open — an "Out of scope" line, or a note like the
  `tsc` type-check gap the Ops/Infra Guild left for the Architecture or
  Code Style Guild — is exactly the kind of thing to log, since the gap
  was already recognized as wanted.
> Enforcement: agent-reviewed — applying the generalization test is a
> judgment call by definition.

### Logging a `process-gaps.md` entry
"Logging a `guild-proposals.md` entry" above only covers the case where
an agent affirmatively concludes something generalizes into a candidate
Guild rule. It says nothing about the case one step short of that: an
agent identifies something real, but concludes that acting on it, or
logging it as a Guild proposal, is not its scope right now. That
conclusion is itself a real decision — a Guild rule staying unwritten,
or a real problem staying unfixed, is a choice being made, not an
absence of one — and it must not live only as an implicit note in
`.quest-progress.json` (or equivalent progress-tracking state). That
file tracks *where the flow is*; nothing reads it looking for a
scope-boundary decision like this one, so a finding recorded only there
is effectively lost the moment the Quest moves past that step.
- **When this applies**: any time an agent reaches "this is real, but
  it's not my scope to act on or log as a Guild proposal right now" —
  whether because the fix belongs to a step or agent that hasn't run
  yet, because it falls outside every Guild's current authority
  boundary, or because acting on it would itself need the
  `agent-recommended, human-confirmed` gate this Guild already defines
  and there's no way to see that through in the current turn.
- **What to log**: an entry in `process-gaps.md` — distributed to every
  new Quest by `guildhall init` the same way `guild-proposals.md` is
  (see the master spec, section 7, and `bin/cli.js`) — in the format
  that file's own header documents: what was observed, why it wasn't
  escalated as a Guild proposal, a suggested next step if the agent has
  one, and a status.
- **Why a separate file, not a `guild-proposals.md` entry marked
  "rejected"**: the two questions are genuinely different. A
  `guild-proposals.md` entry asks "should this become a Guild rule?" —
  a yes/no/defer decision, per "Logging a `guild-proposals.md` entry"
  above. A `process-gaps.md` entry asks "should someone act on this at
  all, and if so, how?" — the answer might turn out to be a Guild rule,
  but just as easily a one-off fix, a maintenance Quest, or a formal
  incident. Folding the second question into the first would force
  every real-but-out-of-scope finding through a generalization test it
  was never trying to pass.
- **Not yet decided**: whether an entry needs a severity tag (e.g.
  distinguishing an incident-shaped finding from a low-stakes note) is
  explicitly left open, to be revisited once the mechanism has seen real
  use — not guessed at now with no real entries to validate against, the
  same discipline this Guild's own "Out of scope" sections already
  apply elsewhere.
> Enforcement: agent-reviewed — recognizing "this is real but not my
> scope right now," like the generalization test above, is a judgment
> call. `guildhall review-proposals` surfaces logged entries from every
> known Quest's `process-gaps.md` for human review, in a section kept
> separate from `guild-proposals.md` — accept/reject doesn't apply the
> same way to a process gap as it does to a candidate rule.

### Cross-guild synchronization
When a Guild rule closes a gap another Guild explicitly left open (an
"Out of scope" line, or a note like "belongs to Guild X once it
exists"), the origin Guild must be updated in the *same* commit/PR — not
just the Guild doing the closing. This is the pattern the Data Guild
already followed three times in one pass — closing gaps the Ops/Infra
Guild and the Monitoring Guild had each left open, and going back to
update both origin files rather than leaving them stale. Applying the
project's own generalization test to the pattern itself: does this apply
the same way regardless of which two Guilds are involved? Yes — any
time one Guild closes a gap named by another, the same staleness risk
exists, which is what makes it a rule here instead of a one-off habit.
> Enforcement: automated (custom) — a CI check on the guildhall repo
> itself scans every Guild file for forward-reference patterns in its
> "Out of scope" section ("belongs to Guild X", "owned by Guild X") and
> fails if the referenced file wasn't touched in the same diff. Same
> reasoning the Data Guild applied to its point-in-time-recovery check:
> the pattern is mechanical enough to script, so it's implemented
> directly rather than left as a future candidate.
>
> Known limitation: the check only proves the origin file was *touched*
> in the same diff, not that the removed line was actually replaced by a
> real pointer back to the closing Guild's rule — a line could be deleted
> outright, or edited for an unrelated reason, and still pass. The
> Monitoring Guild's "Post-incident documentation format" closure (by the
> Documentation Guild) hit exactly this blind spot: the "Out of scope"
> line was correctly removed, but the back-reference in "Incident
> response" was initially missed, and the automated check had no way to
> catch that. Logged as a `guild-proposals.md` candidate for guildhall
> itself: tightening the script to also require a positive reference to
> the closing Guild's name somewhere in the origin file's diff, not just
> touching the file.

### Encountering a Guild in `draft` status
When an agent needs a Guild that's still `status: draft` mid-task:
- It does not silently invent rules and proceed as though the Guild were
  finished.
- It does not block and escalate to a human on every draft encounter
  either — that would make an incomplete guildhall unusable while it's
  still being written, which is exactly the situation these Guilds were
  authored under.
- **Fallback**: make the most conservative decision derivable from
  adjacent, already-active Guilds (e.g. the Documentation Guild is draft
  → follow the Code Style Guild's language policy and whatever
  conventions comparable finished Guilds already use), label that
  decision explicitly as "no Guild coverage — used judgment" in the
  agent's own output, and treat it as a `guild-proposals.md` candidate
  under the rule above — a gap surfaced by hitting a draft Guild is
  exactly the kind of thing worth capturing.
- **Escalate instead of proceeding** only when the missing Guild's rule
  would gate an action that is itself production-facing and irreversible
  — the same test used for `agent-recommended, human-confirmed` above.
  Anything lower-stakes proceeds with a documented judgment call instead
  of blocking the whole Quest on a Guild that isn't ready.
> Enforcement: agent-reviewed.

### Standard agent prompt structure
Based on the pattern used to author every Guild in this repository so
far, a prompt directing any agent in this project — not only the
Guild-authoring one — should include:
1. **Role and context** — which agent it's acting as, and which
   repo/Quest it's operating in.
2. **Required reading** — an explicit list of Guild files (and spec.md
   sections) to read before acting, not a vague "check the Guilds."
3. **Prior state** — what already exists and is already settled (past
   decisions, files already written), so the agent doesn't re-derive or
   contradict them.
4. **The concrete task** — what to produce or change, and the exact
   output format expected.
5. **An explicit request for gaps** — asking the agent to report, at the
   end, any decision it made that wasn't covered by an existing Guild or
   the spec. This is the practice this Guild's own authoring has
   followed at every step, and it's what feeds
   "Logging a `guild-proposals.md` entry" above.
> Enforcement: agent-reviewed — a human, or the agent dispatching another
> agent, checks a prompt roughly follows this shape before sending it;
> not something CI can check, since prompts aren't committed artifacts
> the way code is.

## Out of scope

**Real gap, not a conscious decision:**
- **Cost or token budget management** per agent — nothing here explains
  why this was left out; it simply hasn't been addressed.
- **Arbitration when two agents' outputs conflict** (e.g. the Architect's
  design and the Data Guild's default disagree in a specific case) — no
  resolution rule is defined, and nothing states this was deliberate.

Worth a `guild-proposals.md` entry once a real Quest actually surfaces
one of these, rather than guessed at now with nothing to validate
against.

**Conscious minimum-scope decisions:**
- **Literal system prompts / persona text** per named agent — the roles
  and their authority boundaries are defined here; the prompt templates
  themselves are Quest-tooling, not Guild content.

This last one is a candidate for a future revision of this Guild once
real Quests surface a concrete need, not something to re-propose from
scratch via `guild-proposals.md`.

## Enforcement maturity
"Cross-guild synchronization" was the obvious first candidate here — it
was formalized only after the same pattern repeated three times in one
sitting (Data Guild closing gaps in Ops/Infra and Monitoring), which was
itself the signal that it's mechanical enough to script — so it was
implemented directly as `automated (custom)` above rather than left as a
future candidate. Of the rules still `agent-reviewed`, "Agent roles and
decision authority" is the next most likely partial candidate: whether a
specific action falls inside or outside an agent's bounded authority is
a judgment call, but *whether an agent's output cites the Guild it was
supposed to consult at all* is a mechanical presence check that could be
scripted before the deeper judgment ever automates. The
`agent-recommended, human-confirmed` classification rule, by contrast, is
not a maturity candidate at all — like the rollback confirmation gate it
generalizes from, it stays a human checkpoint by design, independent of
how good the classification tooling gets.

## Proposal log
See the master spec, section 6.

## Changelog
- **0.1.10** (2026-08-30) — "Standard agent output locations" gained two
  rows for the Architecture Guild's new "External dependencies —
  mocking and the integration contract": Loremaster's
  `docs/integration-contract.md` skeleton at `/quest-embark`, and
  Artificer's `mocks/` fixtures plus incremental contract entries at
  `/quest-embark` (scaffold) and each relevant `/quest-forge`. Both only
  apply when Herald's Vision Mode intake flagged an external dependency
  — not every Quest gets these outputs. "Agent roles and decision
  authority" 's Architect row now also names the mocking-strategy
  decision explicitly, same deviation-flagging treatment as the default
  stack. Cross-guild synchronization with the Architecture Guild's
  `0.1.11`. Evidence: developer feedback that Quests depending on
  another unbuilt application had no standard way to stay independently
  testable, 2026-08-30.
- **0.1.9** (2026-08-30) — Added "Per-agent Checkpoints — a human
  approval after every step, in every skill": a Checkpoint now follows
  every named agent's completed work in all three Quest-phase skills, not
  just the two points the previous revision described (end of
  `/quest-embark`, every `/quest-ship` run). Applies with no exceptions —
  every agent handoff, the `/quest-forge` fix-retry cycle after a flagged
  Warden review, and the last agent in each skill (which previously ended
  the skill's turn without a dedicated approval of its own). Retires the
  old combined Quest Brief + architecture Checkpoint in favor of two
  separate ones (after Herald, after Loremaster); `/quest-ship`'s
  pre-deploy scope Checkpoint is unchanged and now sits alongside two new
  ones, after Quartermaster and after Scribe. Reworked "Orchestration
  model" 's per-skill bullets and its Checkpoint-count paragraph to point
  at this new rule instead of describing "two kinds of point." Reworked
  "`.quest-progress.json` — schema for the three-phase model"
  (`version` `"2.0"` → `"3.0"`): `foundation`, every `features[]` entry,
  and every `deploys[]` entry now carry a `steps` object tracking each
  involved agent's own `status`/`checkpoint` individually, and a phase's/
  feature's overall `status` only reaches `done` once every one of its
  `steps` entries does. Evidence: developer feedback that agent reports
  were getting lost in a large conversation because the next agent had
  already started acting on one before a human had a real chance to read
  it, 2026-08-30.
- **0.1.8** (2026-08-26) — Replaced every reference to the retired
  linear twelve-step flow with the three independently invocable
  Quest-phase skills — `/quest-embark` (once per Quest), `/quest-forge
  <feature>` (repeatable, once per feature), `/quest-ship` (repeatable,
  on demand) — across "Agent roles and decision authority" and "Standard
  agent output locations". Added a new "Orchestration model — three
  Quest-phase skills" section describing the three skills themselves and
  the rule that a human Checkpoint now happens at two *kinds* of point
  rather than two fixed steps: the end of `/quest-embark`, and every
  `/quest-ship` run (so it can recur several times per Quest, not just
  once). Added a new "`.quest-progress.json` — schema for the
  three-phase model" section, replacing the old single `steps` map with
  three sections (`foundation`, `features`, `deploys`) and a worked
  example. "Standard agent output locations" now also lists
  `docs/feature-backlog.md` and `docs/features/<slug>.md` as Herald
  outputs, both written by `/quest-embark`/`/quest-forge` respectively.
  The retired `/quest-flow` skill itself is out of scope for this entry
  — handled separately. Evidence: process change following
  calculator-quest retrospective, 2026-08-25.
- **0.1.7** (2026-08-25) — Added "Logging a `process-gaps.md` entry": a
  new mandatory rule requiring any agent that concludes "this is real,
  but not my scope to act on or log as a Guild proposal right now" to
  record that conclusion in `process-gaps.md`, rather than leaving it
  implicit in `.quest-progress.json` (or equivalent progress-tracking
  state). `process-gaps.md` is now scaffolded by `guildhall init` the
  same way `guild-proposals.md` is, and `guildhall review-proposals`
  surfaces both, in separate sections (`bin/cli.js`; guildhall/CLI's own
  `package.json` version bumped alongside this Guild — see the root
  `CHANGELOG.md`). No severity tag exists yet — left open on purpose,
  per the same entry's "Not yet decided" note. Evidence:
  calculator-quest, steps 8 (Warden) and 11 (Quartermaster).
- **0.1.4** (2026-08-25) — Added "Standard agent output locations": a
  cross-cutting table mapping each flow agent (Herald, Loremaster,
  Artificer, Sentinel, Warden, Quartermaster, Scribe) to its expected
  output location, filled in from what's already defined elsewhere (or
  marked "not yet standardized" where nothing is). Formalizes
  `docs/architecture.md` as the Loremaster's output location, replacing
  the ad hoc convention calculator-quest used with no Guild to point at.
  The Architecture Guild's Purpose now cross-references the Loremaster
  row instead of leaving the location undefined (same commit — cross-
  guild synchronization). Evidence: calculator-quest, step 3
  (Loremaster).
- **0.1.3** (2026-08-25) — Added a short cross-reference from the
  Product agent's entry in "Agent roles and decision authority" to the
  Product/Ideation Guild's new "`type` as a default to confirm, not a
  decision made from scratch" rule, instead of duplicating that rule's
  text here. Evidence: calculator-quest, step 2 (Herald). Tracked under
  the shared `guilds/manifest.json` version — see the root
  `CHANGELOG.md` and the README's "Adding or editing a guild" section for
  the versioning convention.
