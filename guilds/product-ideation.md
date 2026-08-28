# Product/Ideation Guild

> Applies to: all Quests
> Status: active

## Purpose
Defines the minimum shape of the two documents Herald, the Product agent,
produces across its two modes (see "Herald's two modes" below) — the
Quest Brief that `/quest-embark` turns a developer's loose, 2-3-sentence
idea into, and the Feature Brief that each `/quest-forge <feature>` call
turns one backlog entry (or a feature described fresh, never in the
backlog) into. The Quest Brief survives largely unchanged from
`/quest-embark`'s architecture design through the Checkpoint that
approves it, at the end of that same skill; a Feature Brief exists only
for the lifetime of the `/quest-forge` invocation it belongs to, feeding
straight into that invocation's implementation, tests, and review. The
AI/Agents Guild already defines Herald's decision authority — *"decides
how to structure and phrase whichever brief it is currently writing. Does
not decide whether the Quest gets built at all ... nor which feature gets
forged next"* — this Guild defines *what* each brief structures: the
required sections for each, how acceptance criteria must be written to
stay checkable, and where the line falls between what Herald can
formalize on its own and what it must ask the developer before
proceeding. It does not redefine that authority boundary.

The Documentation Guild's README rule already assumes the Quest Brief
exists at `docs/quest-brief.md` and treats it as the Quest's single
source of truth for the app's *vision*, never duplicated into the README
itself — this Guild is what makes that assumption concrete. Section 3.1
of the master spec defines the Brief's `type` field (`web-app | api | cli
| script`), used by the guildhall CLI to decide which conditional Guilds
get copied into a new Quest — this Guild formalizes that field as a
required part of the Quest Brief's format below, using the exact same
vocabulary already in `guilds/manifest.json`'s `appliesTo` lists, not a
second one that could drift out of sync with it. That the Architecture
Guild has not yet defined a default stack or folder layout for
`cli`/`script` Quests (its own "Out of scope," "Real gap") does not block
this Guild: a Quest Brief only needs to name its `type` honestly, not
resolve what that type's stack should be — that gap belongs to the
Architecture Guild to close, not this one.

Consulted by Herald when drafting either brief, and by the developer at
`/quest-embark`'s Checkpoint as the standard the Quest Brief is read
against before it's approved. A Feature Brief has no Checkpoint of its
own — see the AI/Agents Guild's "Orchestration model — three Quest-phase
skills" for why: its review happens through Warden inside the same
`/quest-forge` invocation, not a human pause.

## Rules

### Herald's two modes: Vision Mode and Feature Brief Mode
Herald does not always produce the same document, or the same amount of
it. Which one it writes, and how complete that document is, depends
entirely on which skill invoked it — the AI/Agents Guild's "Orchestration
model — three Quest-phase skills" is the authority on the skills
themselves; this rule is what each mode means for the *content* Herald is
responsible for.

- **Vision Mode** — invoked once per Quest, by `/quest-embark`. Herald
  produces the Quest Brief (`docs/quest-brief.md`, format below) *and*
  the feature backlog (`docs/feature-backlog.md`, format below) in the
  same invocation. The Quest Brief is **deliberately incomplete**: it
  covers the app's overall vision, its `type`, and general, app-level
  success criteria — it does not, and must not, break acceptance
  criteria down feature by feature. The backlog is the intentional home
  for that feature-level detail, and even there only in loose, one-to-
  two-sentence form per candidate feature — full acceptance criteria,
  scope, and edge cases for any one feature are Feature Brief Mode's job,
  not Vision Mode's.
- **Feature Brief Mode** — invoked once per `/quest-forge <feature>`
  call, as many times as the backlog (and the developer) need. Herald
  takes one feature — either an existing `docs/feature-backlog.md` entry,
  or a feature the developer describes fresh at invocation time that was
  never in the backlog — and produces a complete, detailed Feature Brief
  for *only* that feature at `docs/features/<slug>.md` (format below):
  full acceptance criteria, scope, and edge cases. Nothing about any
  other feature is in scope for this invocation, including other
  `planned` backlog entries.

**Why the split, not one document written twice**: the Quest Brief's
incompleteness is not a temporary state meant to be filled in later by
editing the same file — it's the intended end state of that document.
Feature-level detail lives permanently in `docs/features/<slug>.md`
files, one per forged feature, never folded back into
`docs/quest-brief.md`. A Quest Brief that eventually enumerated every
feature in full would just duplicate what the backlog and each Feature
Brief already say, with two places that could drift out of sync.
> Enforcement: agent-reviewed — whether a given Quest Brief has actually
> stayed at vision-level, versus drifted into feature-by-feature detail
> that belongs in a Feature Brief instead, is a judgment call for
> whichever human reviews it at `/quest-embark`'s Checkpoint.

### Quest Brief format — Vision Mode's output
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
   directly from the developer's original idea: what problem this solves
   and for whom. Not a feature list — that's "Scope" below.
4. **Scope** — the app's overall vision and capabilities at the *Quest*
   level ("a CLI tool that renames files in a directory according to
   patterns"), not vague goals ("a file organization tool"), and not a
   feature-by-feature breakdown — that granularity belongs in
   `docs/feature-backlog.md` (loosely) and in each feature's own
   `docs/features/<slug>.md` (in full), per "Herald's two modes" above.
5. **Out of scope** — see the dedicated rule below.
6. **Acceptance criteria** — general, app-level success criteria only
   (e.g. "the tool is installable via a single command and runs offline")
   — see "Acceptance criteria must be verifiable" below for what
   "verifiable" means at this level versus at the Feature Brief level.
7. **Open questions / assumptions** — anything Herald had to assume
   rather than fully resolve, or is explicitly flagging forward for the
   Architect or for `/quest-embark`'s Checkpoint rather than deciding
   itself.
> Enforcement: automated (custom) — a script checks all seven headings are
> present in `docs/quest-brief.md` and that the Type value is one of the
> four values already declared in `guilds/manifest.json` (read from that
> file, not hardcoded separately, so the two can't drift). Whether the
> content under each heading is actually accurate, complete, and stays at
> vision-level rather than drifting into feature-by-feature detail is
> agent-reviewed and confirmed by `/quest-embark`'s human Checkpoint.

### Feature backlog format — Vision Mode's second output
`/quest-embark` does not end with just a Quest Brief; Herald also writes
`docs/feature-backlog.md` in the same invocation, per "Herald's two
modes" above. It is a loose, working list, not a second Quest Brief:
- One entry per candidate feature, each **one to two sentences** — enough
  to name what the feature is and why it matters, not enough to be
  actionable on its own. A backlog entry that reads like the start of a
  Feature Brief (acceptance criteria, edge cases) has overshot what this
  document is for.
- Each entry carries a **status**: `planned`, `in-progress`, or `done`.
  A `/quest-forge <feature>` invocation moves an entry from `planned` to
  `in-progress` when Herald starts that feature's Feature Brief, and to
  `done` once Warden's review of that feature completes — the same
  statuses `.quest-progress.json`'s `features` array tracks per entry
  (AI/Agents Guild), kept in sync rather than duplicated as a second
  source of truth.
- The backlog is never assumed complete. A developer describing a brand
  new feature at `/quest-forge` invocation time, one that was never in
  this file, is an expected and supported path (see "Herald's two modes"
  above) — not a sign the backlog was written wrong at `/quest-embark`.
  When that happens, Herald adds the new entry to the backlog as part of
  writing that feature's Brief, so the backlog stays the honest record of
  every feature the Quest has taken on, not just the ones anticipated up
  front.
> Enforcement: agent-reviewed — no script yet checks the one-to-two-
> sentence discipline or that `status` values stay in sync with
> `.quest-progress.json`; both are candidates once a real Quest's backlog
> drifts in a way worth catching mechanically.

### Feature Brief format — Feature Brief Mode's output
A Feature Brief lives at `docs/features/<slug>.md` — one file per forged
feature, written the first time that feature's `/quest-forge` invocation
runs, never before. `<slug>` is a short, URL-safe, kebab-case identifier
Herald derives from the feature's name (matching the `slug` field
`.quest-progress.json`'s `features` array records — AI/Agents Guild), and
must match the corresponding `docs/feature-backlog.md` entry when one
exists. Contains these sections, in order, with the same "nothing is
optional" discipline as the Quest Brief above:
1. **Title** — the feature's name, one line.
2. **Context** — one to two sentences on how this feature relates to the
   Quest's overall vision in `docs/quest-brief.md` — not a restatement of
   the whole Brief, just the connection.
3. **Scope** — what this feature will do, as concrete capabilities, at
   the same level of concreteness the Quest Brief's "Scope" rule above
   requires at the Quest level.
4. **Out of scope** — see the dedicated rule below, scoped to this one
   feature.
5. **Acceptance criteria** — full, checkable, feature-level detail — see
   "Acceptance criteria must be verifiable" below, which applies at full
   strength here, unlike the general, app-level criteria Vision Mode
   writes into the Quest Brief.
6. **Edge cases** — inputs, states, or conditions specific to this
   feature that Sentinel's tests (Testing/QA Guild) and Warden's review
   need to know about explicitly, rather than discovering them
   unprompted during implementation.
7. **Open questions / assumptions** — same purpose as the Quest Brief's
   own section, scoped to this feature.
> Enforcement: agent-reviewed — no script yet checks these seven headings
> the way "Quest Brief format" above is checked; a candidate once a real
> Quest has forged enough features to be worth automating against.

### Acceptance criteria must be verifiable
An acceptance criterion is only useful if a reader with no further context
can check it against the finished Quest (or, for a Feature Brief, the
finished feature) and get an unambiguous yes or no — not one that requires
going back to the developer to ask what was actually meant. This applies
to both documents Herald writes, at the level of detail each is meant to
carry (per "Herald's two modes" above): the Quest Brief's general,
app-level criteria, and a Feature Brief's full, feature-level criteria.
- **Test**: could a human reviewing the relevant document — the Quest
  Brief at `/quest-embark`'s Checkpoint, or a feature against its Feature
  Brief once forged — evaluate this criterion without needing to ask a
  clarifying question first? If not, it isn't specific enough yet. This is
  a human judgment for the Quest Brief's app-level criteria, applied at
  `/quest-embark`'s Checkpoint; for a Feature Brief, Warden's review
  inside `/quest-forge` is the first check, with any features included in
  a given release getting a further human look at that `/quest-ship`
  run's Checkpoint. Warden's own checklist (AI/Agents Guild) stays
  "Security + Code Style, including the language check" — checking
  implementation against a brief's acceptance criteria is a judgment
  Herald and the human Checkpoints apply, not something this rule folds
  into Warden's scope.
- Vague, not acceptable on its own: "the app should be fast," "good UX,"
  "handles errors well."
- Concrete, acceptable: "the CLI exits with a non-zero code and a message
  on stderr when given a missing file," "an invalid form submission shows
  an inline error next to the offending field, per the Security Guild's
  input-validation rule," "the search endpoint returns results within
  500ms for a typical query."
- A criterion may reference a rule another Guild already owns (the input-
  validation example above) instead of restating it — the brief points at
  the standard, it doesn't duplicate it.
- **Why this matters downstream**: a vague criterion doesn't remove the
  ambiguity, it just defers it — from whichever invocation is writing it,
  where the developer is available to resolve it cheaply, to a later
  `/quest-ship` Checkpoint, where resolving it means reopening a decision
  that should already have been settled.
> Enforcement: agent-reviewed — Herald applies the checkability test while
> drafting either document; the relevant human Checkpoint is the backstop
> if a vague criterion slips through.

### Explicit "out of scope" in either brief
Already used informally since the MVP (master spec, section 9); this Guild
makes it a required section in both the Quest Brief and every Feature
Brief, rather than an implicit habit that depends on whoever's writing it
remembering to include it.
- A Quest Brief states what the Quest will *not* do in this iteration; a
  Feature Brief states what that one feature will not do — not because
  it's a bad idea, but to give Artificer a boundary instead of an
  unstated one it has to guess at during `/quest-embark`'s scaffold or a
  `/quest-forge` invocation's implementation.
- Same discipline a Guild document itself follows in its own "Out of
  scope" section (spec, section 3.2), applied one level down: distinguish
  what's left out because of a real constraint the developer stated ("no
  mobile app — web only, no device to test against") from what's left out
  as a deliberate minimum-scope call for this iteration ("no user
  accounts — single-user tool for v1").
- **Why this matters for the Checkpoint**: an item silently missing from a
  brief is indistinguishable from an oversight Herald simply didn't think
  of. The same item, explicitly listed as out of scope, is a decision the
  developer already saw and can push back on — at `/quest-embark`'s
  Checkpoint for the Quest Brief, or at the next `/quest-ship` run for a
  feature that's part of that release — instead of surfacing as a
  surprise once the Quest (or feature) is already built.
> Enforcement: automated (custom) — a script checks the section exists and
> is non-empty in both `docs/quest-brief.md` and every
> `docs/features/<slug>.md` (a placeholder like "TBD" doesn't count, and
> fails the same check). Whether a given item is reasonably scoped, versus
> scoping out something the Quest or feature can't actually work without,
> is agent-reviewed.

### Herald's authority: what it infers versus what it asks
The AI/Agents Guild already grants Herald authority over *how* to
structure and phrase whichever brief it's writing. This rule draws the
line for *content* it can decide alone versus content it must ask the
developer about first — in both modes, though the specific triggers below
are Vision-Mode-shaped (they're about the whole Quest, including `type`,
which only Vision Mode ever sets).
- **Formalizes alone**: phrasing, section structure, translating a rough
  idea into the format above, and drawing a reasonable default when the
  idea clearly implies it — e.g. inferring `type: cli` from "a script that
  renames files on my machine" without asking, since no other value would
  reasonably fit that description.
- **Asks the developer first**, before producing a Quest Brief at all,
  when any of the following holds:
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
    section can't be written without Herald unilaterally picking an
    iteration boundary the developer never stated — e.g. "a note-taking
    app," with no signal about whether v1 needs sync, sharing, or search.
- **Feature Brief Mode's own version of this test**: the same "asks first"
  trigger applies at the feature level when a `/quest-forge <feature>`
  invocation's feature — whether from the backlog or described fresh — is
  ambiguous enough that two genuinely different Feature Briefs could be
  written for it, or open-ended enough that a meaningful "Out of scope"
  section for just that feature can't be written without Herald guessing
  an iteration boundary. `type` itself is never re-asked here — it's
  already settled by Vision Mode (see "`type` as a default to confirm"
  below, which applies unchanged regardless of mode).
- **Why one question, not an intake form**: the goal is one clarifying
  question (or a short numbered list, if more than one thing is genuinely
  unclear) — not exhaustive requirements gathering for a 2-3-sentence idea
  or a one-line feature request. This mirrors the Security Guild's
  one-sentence dependency justification: enough friction that an ambiguous
  idea doesn't silently become a guessed brief, not so much that ideation
  or feature-forging stops being fast.
> Enforcement: agent-reviewed — the AI/Agents Guild's "Agent roles and
> decision authority" is the backstop when Herald oversteps into deciding
> something ambiguous instead of asking, in either mode.

### `type` as a default to confirm, not a decision made from scratch
The rule above reads as if Herald infers `type` fresh from the idea every
time it runs. It doesn't actually start from nothing: the guildhall CLI's
`init` command already writes `questType` into `.guildhall-lock.json` at
scaffold time, from the developer's `--type` flag, before Herald is even
invoked for the first time — structurally, since `init` needs that value
up front to decide which conditional Guilds to copy in (master spec,
section 7). Surfaced concretely by calculator-quest, step 2 (Herald),
where the Product/Ideation Guild's own text still described `type` as
decided from scratch, with no mention of the value `init` had already
fixed earlier.
- Herald treats an already-fixed `type` as a **default to confirm**
  against the idea it's given, not a value to decide from scratch. If the
  idea is consistent with the fixed `type`, Herald proceeds — a value
  already existing is not, on its own, one of the "asks the developer
  first" cases above.
- If the idea conflicts with the fixed `type` (e.g. `.guildhall-lock.json`
  says `cli`, but the idea describes something with user accounts and a
  browser UI), Herald does not block and does not silently overrule
  either value. It records the conflict — naming both the fixed `type`
  and what the idea implies — in the Quest Brief's "Open questions /
  assumptions" section, and leaves it for `/quest-embark`'s human
  Checkpoint to resolve, the same place this Guild already routes every
  other assumption Herald can't fully settle alone.
- **Why not block outright**: blocking `/quest-embark` entirely over a
  `type` mismatch would stop the flow earlier than every other ambiguity
  this Guild handles, all of which reach the Checkpoint through the Brief
  rather than a hard stop mid-invocation. A mismatched `type` is the same
  shape of problem — worth surfacing, not worth halting ideation for.
- **This rule is Vision-Mode-only, and unchanged by the three-phase
  restructuring**: `type` is fixed once, at `init`, before `/quest-embark`
  ever runs, and confirmed or flagged exactly once, inside that same
  `/quest-embark` invocation — never re-asked or re-confirmed by any
  `/quest-forge <feature>` invocation, since by the time a feature is
  being forged the Quest's `type` was already settled (and, if conflicted,
  already resolved at the Checkpoint) back at `/quest-embark`. Splitting
  the old flow into three skills changes *when* Vision Mode runs relative
  to feature work — it does not change this rule's substance.
> Enforcement: agent-reviewed — same backstop as "Herald's authority"
> above; `/quest-embark`'s Checkpoint is the resolution point for a
> recorded conflict.

### When an idea (or a feature) is too vague to become a brief yet
If, after asking the clarifying question above, the developer's answer is
still too thin to fill in Problem/Scope/Acceptance criteria (Vision Mode)
or Scope/Acceptance criteria/Edge cases (Feature Brief Mode) with anything
concrete — not merely missing the `type` value, but genuinely short on
what the Quest or feature is for — Herald does not produce a brief anyway,
padded with placeholder or generic content just to satisfy the format
rules above.
- A brief that merely *looks* complete is worse than an explicit stop: it
  passes a heading-presence check, then fails silently later — either at
  the relevant Checkpoint, where the developer now has to substantially
  rewrite it instead of just approving it, or worse, after Loremaster has
  already designed architecture against a Quest Brief that didn't
  actually mean anything, or Artificer has already implemented against a
  Feature Brief that didn't.
- Correct behavior: state plainly what's still missing, ask again, and do
  not proceed — to architecture design in Vision Mode, or to
  implementation in Feature Brief Mode — until there's enough to write
  real, checkable content in each section.
- This is this Guild's own instance of the same principle behind the
  AI/Agents Guild's "Encountering a Guild in draft status" fallback:
  proceed with a documented judgment call when the gap is low-stakes,
  stop rather than paper over it when proceeding would let something
  unsound reach a gate it isn't ready for. `/quest-embark`'s Checkpoint is
  exactly that gate for a Quest Brief; Warden's review inside
  `/quest-forge`, and the next `/quest-ship` Checkpoint that feature is
  part of, are the equivalent for a Feature Brief — a malformed or hollow
  brief should never be the thing sitting in front of a reviewer.
> Enforcement: agent-reviewed — whether an idea or feature has crossed
> from "needs one clarifying question" into "not yet resolvable without a
> brief that just restates the ambiguity" is a judgment call; the
> relevant human Checkpoint is the ultimate backstop if Herald proceeds
> anyway.

## Out of scope

**Real gap, not a conscious decision:**
- **Amending a Quest Brief after its Checkpoint approval** — the
  Documentation Guild's ADR rule assumes a Brief is settled "at or before
  the Checkpoint" that closes `/quest-embark`, but no Guild, including
  this one, defines what happens when a later `/quest-forge` or
  `/quest-ship` invocation surfaces a needed change to the Quest Brief
  itself — a missed piece of the app's vision, an app-level acceptance
  criterion that turns out to be wrong. This is narrower than it was
  under the old flow, since feature-level detail no longer lives in the
  Quest Brief at all (it lives in `docs/features/<slug>.md`, which each
  `/quest-forge` invocation is free to write fresh), but the gap for the
  Quest Brief's own vision-level content is real and still open. Whether
  amending it requires re-running `/quest-embark`'s Checkpoint, is
  captured as an ADR instead (Documentation Guild), or is simply edited
  in place isn't decided anywhere yet. No real Quest built with the full
  flow has hit this case yet (master spec, section 1); worth a
  `guild-proposals.md` entry once one does, not guessed at here with
  nothing to validate it against.

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
- **Prioritization or sequencing, across Quests or within one Quest's
  feature backlog** — this Guild governs the *content* of the Quest
  Brief, the feature backlog, and each Feature Brief, not the order
  anything gets built in. Deciding which idea to build next is a
  developer decision made before `/quest-embark` even starts; deciding
  which `docs/feature-backlog.md` entry to forge next, and in what order,
  is equally a developer decision made by choosing what to pass to
  `/quest-forge` — neither is something this Guild's formats need to
  encode (no priority field, no ranking).

These are candidates for a future revision of this Guild once a real Quest
surfaces a concrete need, not something to re-propose from scratch via
`guild-proposals.md` — the same generalization discipline the Architecture,
Security, and Code Style Guilds' own "Out of scope" sections already apply
to their deferred items.

## Enforcement maturity
The heading-presence and `type`-value checks in "Quest Brief format," and
the non-empty check in "Explicit 'out of scope' in either brief," were
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
governing when Herald asks the developer versus proceeds alone ("Herald's
authority" and "When an idea (or a feature) is too vague") are poor
maturity candidates by contrast — both depend on judging whether an idea
or feature is ambiguous, the same kind of intent-reading the Architecture
Guild's "stated deviation is actually justified" judgment depends on, and
neither reduces to a mechanical check.

## Proposal log
See the master spec, section 6.

## Changelog
- **0.1.9** (2026-08-26) — Reworked this Guild for the AI/Agents Guild's
  new three-phase orchestration model (`/quest-embark`, `/quest-forge
  <feature>`, `/quest-ship`, replacing the retired linear flow — see
  `guilds/ai-agents.md`'s "Orchestration model — three Quest-phase
  skills"). Added "Herald's two modes: Vision Mode and Feature Brief
  Mode": Herald now produces a *deliberately incomplete* Quest Brief plus
  a loose `docs/feature-backlog.md` (one to two sentences per candidate
  feature) when invoked by `/quest-embark` (Vision Mode), and a complete,
  detailed Feature Brief for exactly one feature at
  `docs/features/<slug>.md` — acceptance criteria, scope, edge cases —
  when invoked by `/quest-forge <feature>` (Feature Brief Mode), whether
  that feature came from the backlog or was described fresh. Added
  "Feature backlog format" and "Feature Brief format" as new rules, and
  updated "Quest Brief format," "Acceptance criteria must be verifiable,"
  "Explicit 'out of scope'," "Herald's authority" (renamed from "Product
  agent authority"), and "When an idea (or a feature) is too vague"
  throughout to describe both documents/modes instead of one linear
  Brief. Made explicit, in "`type` as a default to confirm," that its
  rule is unchanged by this restructuring: `type` is still fixed once by
  `init` and confirmed only inside `/quest-embark`, never re-asked by
  `/quest-forge`. Evidence: process change following calculator-quest
  retrospective, 2026-08-25.
- **0.1.3** (2026-08-25) — Added "`type` as a default to confirm, not a
  decision made from scratch" to "Product agent authority": the Product
  agent treats a `type` already fixed in `.guildhall-lock.json` at `init`
  as a default to confirm against the received idea, logging a conflict
  in "Open questions / assumptions" for the step 4 Checkpoint instead of
  blocking. Cross-referenced from the AI/Agents Guild's "Agent roles and
  decision authority" (same commit — cross-guild synchronization).
  Evidence: calculator-quest, step 2 (Herald). Tracked under the shared
  `guilds/manifest.json` version — see the root `CHANGELOG.md` and the
  README's "Adding or editing a guild" section for the versioning
  convention.
