# Product/Ideation Guild

> Applies to: all Quests
> Status: active

## Purpose
Defines the minimum shape of a Quest Brief — the requirements document that
development flow step 2 (master spec, section 5) turns a developer's loose,
2-3-sentence idea (step 1) into, and that then survives largely unchanged
through architecture design (step 3) up to the Checkpoint that approves it
(step 4). The AI/Agents Guild already defines the Product agent's decision
authority at step 2 — *"decides how to structure and phrase a Quest Brief
from the idea given. Does not decide whether the Quest gets built at
all"* — this Guild defines *what* it structures: the required sections,
how acceptance criteria must be written to stay checkable once implementation
starts, and where the line falls between what the Product agent can
formalize on its own and what it must ask the developer before proceeding.
It does not redefine that authority boundary.

The Documentation Guild's README rule already assumes this document exists
at `docs/quest-brief.md` and treats it as the Quest's single source of
truth for *what* was requested, never duplicated into the README itself —
this Guild is what makes that assumption concrete. Section 3.1 of the
master spec defines the Brief's `type` field (`web-app | api | cli |
script`), used by the guildhall CLI to decide which conditional Guilds get
copied into a new Quest — this Guild formalizes that field as a required
part of the Brief's format below, using the exact same vocabulary already
in `guilds/manifest.json`'s `appliesTo` lists, not a second one that could
drift out of sync with it. That the Architecture Guild has not yet defined
a default stack or folder layout for `cli`/`script` Quests (its own "Out of
scope," "Real gap") does not block this Guild: a Quest Brief only needs to
name its `type` honestly, not resolve what that type's stack should be —
that gap belongs to the Architecture Guild to close, not this one.

Consulted by the Product agent when drafting a Brief (step 2), and by the
developer at the Checkpoint (step 4) as the standard a Brief is read
against before it's approved.

## Rules

### Quest Brief format
A Quest Brief lives at `docs/quest-brief.md` and contains these sections,
in order. None are optional — a section with genuinely nothing to say
still exists, stating that explicitly (e.g. "Out of scope: none identified
beyond the acceptance criteria above"), rather than being dropped:
1. **Title** — the Quest's name, one line.
2. **Type** — exactly one of `web-app | api | cli | script` (master spec,
   section 3.1), using the same four values as `guilds/manifest.json`'s
   `appliesTo` lists. This is what the guildhall CLI uses to select which
   conditional Guilds apply to the Quest — a value outside this vocabulary,
   or more than one value, isn't a Brief the CLI can act on.
3. **Problem / motivation** — one to three sentences, usually adapted
   directly from the developer's step-1 idea: what problem this solves and
   for whom. Not a feature list — that's "Scope" below.
4. **Scope** — what the Quest will do, as concrete capabilities ("a CLI
   command that renames files in a directory according to a pattern"), not
   vague goals ("a file organization tool").
5. **Out of scope** — see the dedicated rule below.
6. **Acceptance criteria** — see the dedicated rule below.
7. **Open questions / assumptions** — anything the Product agent had to
   assume rather than fully resolve, or is explicitly flagging forward for
   the Architect (step 3) or the Checkpoint (step 4) rather than deciding
   itself.
> Enforcement: automated (custom) — a script checks all seven headings are
> present in `docs/quest-brief.md` and that the Type value is one of the
> four values already declared in `guilds/manifest.json` (read from that
> file, not hardcoded separately, so the two can't drift). Whether the
> content under each heading is actually accurate, complete, and well
> reasoned is agent-reviewed and confirmed by the human Checkpoint (step 4).

### Acceptance criteria must be verifiable
An acceptance criterion is only useful if a reader with no further context
can check it against the finished Quest and get an unambiguous yes or no —
not one that requires going back to the developer to ask what was actually
meant.
- **Test**: could the human at either Checkpoint — reading the Brief at
  step 4, or checking the built Quest against it at step 9 — evaluate this
  criterion without needing to ask a clarifying question first? If not,
  it isn't specific enough yet. This is a human judgment, not the Reviewer
  agent's: the AI/Agents Guild scopes the Reviewer's checklist (step 8) to
  "Security + Code Style checklist, including the language check" — it
  does not include checking the Quest against the Brief's acceptance
  criteria.
- Vague, not acceptable on its own: "the app should be fast," "good UX,"
  "handles errors well."
- Concrete, acceptable: "the CLI exits with a non-zero code and a message
  on stderr when given a missing file," "an invalid form submission shows
  an inline error next to the offending field, per the Security Guild's
  input-validation rule," "the search endpoint returns results within
  500ms for a typical query."
- A criterion may reference a rule another Guild already owns (the input-
  validation example above) instead of restating it — the Brief points at
  the standard, it doesn't duplicate it.
- **Why this matters downstream**: acceptance criteria are what the human
  checks the finished Quest against at the pre-deploy Checkpoint (step 9).
  A vague criterion doesn't remove the ambiguity, it just defers it — from
  step 2, where the developer is available to resolve it cheaply, to
  step 9, where resolving it means reopening a decision that should
  already have been settled.
> Enforcement: agent-reviewed — the Product agent applies the checkability
> test while drafting; the human Checkpoint at step 4 is the backstop if a
> vague criterion slips through.

### Explicit "out of scope" in the Brief
Already used informally since the MVP (master spec, section 9); this Guild
makes it a required section rather than an implicit habit that depends on
whoever's writing the Brief remembering to include it.
- Every Brief states what the Quest will *not* do in this iteration — not
  because it's a bad idea, but to give later steps a boundary instead of
  an unstated one the Builder has to guess at during implementation
  (steps 5-6).
- Same discipline a Guild document itself follows in its own "Out of
  scope" section (spec, section 3.2), applied one level down at the Quest
  level: distinguish what's left out because of a real constraint the
  developer stated ("no mobile app — web only, no device to test against")
  from what's left out as a deliberate minimum-scope call for this
  iteration ("no user accounts — single-user tool for v1").
- **Why this matters for the Checkpoint**: an item silently missing from a
  Brief is indistinguishable from an oversight the Product agent simply
  didn't think of. The same item, explicitly listed as out of scope, is a
  decision the developer already saw in the Brief and can push back on at
  the Checkpoint (step 4) — it doesn't surface as a surprise once the
  Quest is already built and sitting at the pre-deploy Checkpoint (step 9).
> Enforcement: automated (custom) — a script checks the section exists and
> is non-empty (a placeholder like "TBD" doesn't count, and fails the same
> check). Whether a given item is reasonably scoped, versus scoping out
> something the Quest can't actually work without, is agent-reviewed.

### Product agent authority: what it infers versus what it asks
The AI/Agents Guild already grants the Product agent authority over *how*
to structure and phrase a Brief. This rule draws the line for *content* it
can decide alone versus content it must ask the developer about first.
- **Formalizes alone**: phrasing, section structure, translating a rough
  idea into the format above, and drawing a reasonable default when the
  idea clearly implies it — e.g. inferring `type: cli` from "a script that
  renames files on my machine" without asking, since no other value would
  reasonably fit that description.
- **Asks the developer first**, before producing a Brief at all, when any
  of the following holds:
  - The core problem is ambiguous enough that two genuinely different
    Briefs could be written from the same idea — e.g. "a tool to track my
    expenses" could be a single-user CLI or a multi-user web app with
    accounts, and those imply different `type` values, different Guild
    sets, and different acceptance criteria.
  - The idea doesn't clearly map to one of the four `type` values, and
    picking one would mean guessing rather than inferring — since that
    value determines which conditional Guilds the CLI applies, a wrong
    guess here isn't a cosmetic error.
  - The idea's scope is open-ended enough that a meaningful "Out of scope"
    section can't be written without the Product agent unilaterally
    picking an iteration boundary the developer never stated — e.g. "a
    note-taking app," with no signal about whether v1 needs sync, sharing,
    or search.
- **Why one question, not an intake form**: the goal is one clarifying
  question (or a short numbered list, if more than one thing is genuinely
  unclear) — not exhaustive requirements gathering for a 2-3-sentence idea.
  This mirrors the Security Guild's one-sentence dependency justification:
  enough friction that an ambiguous idea doesn't silently become a guessed
  Brief, not so much that ideation stops being fast.
> Enforcement: agent-reviewed — the AI/Agents Guild's "Agent roles and
> decision authority" is the backstop when the Product agent oversteps
> into deciding something ambiguous instead of asking.

### When an idea is too vague to become a Brief yet
If, after asking the clarifying question above, the developer's answer is
still too thin to fill in Problem/Scope/Acceptance criteria with anything
concrete — not merely missing the `type` value, but genuinely short on
what the Quest is for — the Product agent does not produce a Brief anyway
padded with placeholder or generic content just to satisfy the format in
the first rule above.
- A Brief that merely *looks* complete is worse than an explicit stop: it
  passes a heading-presence check, then fails silently later — either at
  the Checkpoint (step 4), where the developer now has to substantially
  rewrite it instead of just approving it, or worse, after the Architect
  has already spent step 3 designing against content that didn't actually
  mean anything.
- Correct behavior: state plainly what's still missing, ask again, and do
  not proceed to step 3 until there's enough to write real, checkable
  content in each section.
- This is this Guild's own instance of the same principle behind the
  AI/Agents Guild's "Encountering a Guild in draft status" fallback:
  proceed with a documented judgment call when the gap is low-stakes,
  stop rather than paper over it when proceeding would let something
  unsound reach a gate it isn't ready for. The Checkpoint at step 4 is
  exactly that gate for a Quest Brief — a malformed or hollow Brief should
  never be the thing sitting in front of the developer when they're asked
  to approve it.
> Enforcement: agent-reviewed — whether an idea has crossed from "needs one
> clarifying question" into "not yet resolvable without a Brief that just
> restates the ambiguity" is a judgment call; the human Checkpoint (step 4)
> is the ultimate backstop if the Product agent proceeds anyway.

## Out of scope

**Real gap, not a conscious decision:**
- **Amending a Quest Brief after Checkpoint approval** — the Documentation
  Guild's ADR rule assumes a Brief is settled "at or before the Checkpoint
  in step 4," but no Guild, including this one, defines what happens when
  implementation (steps 5-6) surfaces a needed change to the Brief itself
  — a missed requirement, an acceptance criterion that turns out to be
  wrong. Whether that requires re-running the Checkpoint, is captured as an
  ADR instead (Documentation Guild), or is simply edited in place isn't
  decided anywhere yet. No real Quest built with the full flow has hit this
  case yet (master spec, section 1); worth a `guild-proposals.md` entry
  once one does, not guessed at here with nothing to validate it against.

**Conscious minimum-scope decisions**, by contrast — deliberately not yet
covered:
- **UI/wireframe or visual requirements in the Brief** — this Guild's
  format stops at functional scope and checkable acceptance criteria, not
  visual design. The UX/Frontend Guild's "Visual requirements in the
  Quest Brief" rule now closes this: an acceptance criterion may
  reference that Guild's token-conformance and WCAG baseline rules
  directly instead of restating them, the same cross-guild-reference
  pattern this Guild's own acceptance-criteria rule already demonstrates
  with the Security Guild's input-validation example; anything beyond
  that objective baseline (a specific visual identity, a layout, "how it
  should feel") stays Quest-specific and belongs in this Guild's Scope
  section, not standardized by either Guild. No wireframing/mockup tool
  is chosen by either Guild — see the UX/Frontend Guild's "Out of scope."
- **Effort estimation or timelines** (story points, target dates) — this
  is a personal project with a single developer deciding priority
  directly, not a team-planning process with stakeholders to coordinate
  against; a formal estimation field would be process for its own sake.
- **Prioritization or sequencing across multiple Quests** — this Guild
  governs the content of one Quest Brief at a time. Deciding which idea to
  build next, or maintaining a backlog across Quests, is a developer
  decision made before step 1 even starts, not something a Brief itself
  needs to encode.

These are candidates for a future revision of this Guild once a real Quest
surfaces a concrete need, not something to re-propose from scratch via
`guild-proposals.md` — the same generalization discipline the Architecture,
Security, and Code Style Guilds' own "Out of scope" sections already apply
to their deferred items.

## Enforcement maturity
The heading-presence and `type`-value checks in "Quest Brief format," and
the non-empty check in "Explicit 'out of scope' in the Brief," were
implemented directly as `automated (custom)` above rather than left as
future candidates — both are mechanical presence checks, the same shape as
the README section-presence check that matured the same way in the
Documentation Guild. Of the rules that stay `agent-reviewed`, "Acceptance
criteria must be verifiable" is the strongest partial candidate: a script
can flag a criterion containing a small lexicon of vague terms ("fast,"
"good," "nice," "robust," "user-friendly," "handles X well") for mandatory
rewrite before it's ever accepted — the same heuristic shape as the Code
Style Guild's Portuguese-stopword scan and the Security Guild's
`NEXT_PUBLIC_` name heuristic. It would catch the clearest cases without
ever fully replacing a human or agent judging whether a criterion that
*passes* the lexicon check is actually specific enough. The two rules
governing when the Product agent asks the developer versus proceeds alone
("Product agent authority" and "When an idea is too vague") are poor
maturity candidates by contrast — both depend on judging whether an idea
is ambiguous, the same kind of intent-reading the Architecture Guild's
"stated deviation is actually justified" judgment depends on, and neither
reduces to a mechanical check.

## Proposal log
See the master spec, section 6.
