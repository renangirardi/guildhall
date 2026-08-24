# AI/Agents Guild

> Applies to: all Quests
> Status: active

## Purpose
Every other Guild defines a standard for the Quest itself — code, tests,
infrastructure, data. This Guild is different: it defines how the agents
in the development flow (master spec, section 5) are supposed to behave
while consuming and applying those standards — what each agent role can
decide alone, when a proposed action needs a human's explicit go-ahead,
when a new pattern belongs in `guild-proposals.md`, and what to do when
the Guild an agent needs isn't finished yet. It formalizes practices that
were already happening informally across the other seven Guilds before
this one existed. Consulted by every agent, at every step of the flow —
not just one.

## Rules

### Agent roles and decision authority
Each named agent from the development flow consults specific Guilds and
has a bounded authority — decisions within its Guilds' rules are its own
to make; decisions that deviate from those rules, or that reach outside
its step, are not.

- **Product** (step 2, Product/Ideation Guild) — decides how to structure
  and phrase a Quest Brief from the idea given. Does not decide whether
  the Quest gets built at all — that's the human's call at ideation
  (step 1) and confirmed again at the Checkpoint (step 4).
- **Architect** (step 3, Architecture + Data Guild) — decides structural
  choices within those Guilds' defaults, including whether the Quest
  needs a database. Does not decide to deviate from the Architecture
  Guild's default stack without explicitly flagging the deviation for
  the Checkpoint.
- **Builder** (steps 5-6, Code Style + Ops/Infra + Security Guild) —
  decides implementation details within those Guilds' rules, following
  the lib-first-then-UI split (spec section 5). Does not decide to add a
  dependency without the one-sentence justification the Security Guild
  requires, and does not decide to restructure folders against the
  Architecture Guild.
- **QA** (step 7, Testing/QA Guild) — decides which specific scenarios a
  given test suite covers. Does not decide to skip the error/edge-case
  requirement or ship below the coverage threshold.
- **Reviewer** (step 8, Security + Code Style checklist, including the
  language check) — decides what to flag. Does not decide to wave through
  a blocking CI failure as part of approval.
- **Ops** (steps 10-11, Ops/Infra + Monitoring Guild) — decides routine
  deploys that pass every blocking check. Does not decide, alone, to
  execute a rollback or any other high-impact production action — see
  the general rule below.
- **Docs** (step 12, Documentation Guild — still draft) — decides how to
  write up what was built, within whatever the Documentation Guild
  settles on once it's active.
> Enforcement: agent-reviewed — this is a judgment boundary, not a
> mechanical check; the Reviewer agent and the human Checkpoints are the
> backstop when an agent oversteps it.

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
This Guild deliberately does not yet cover:
- **Multi-agent orchestration mechanics** — how agents actually hand off
  to each other (sequential CLI invocation, a full orchestrator, or
  something in between) is an explicitly open decision in the master
  spec (section 11), not settled here.
- **Literal system prompts / persona text** per named agent — the roles
  and their authority boundaries are defined here; the prompt templates
  themselves are Quest-tooling, not Guild content.
- **Cost or token budget management** per agent — not a concern this
  Guild addresses yet.
- **Arbitration when two agents' outputs conflict** (e.g. the Architect's
  design and the Data Guild's default disagree in a specific case) — no
  resolution rule is defined yet.

This is a conscious minimum-scope decision for the current stage of the
project, not an oversight — these are candidates for a future revision of
this Guild once real Quests surface a concrete need, not something to
re-propose from scratch via `guild-proposals.md`.

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
