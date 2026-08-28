# Architecture Guild

> Applies to: all Quests
> Scope: "Default stack," "Folder structure," and "Client vs Server
> Components" below apply to web-app/api Quests using the default
> Next.js stack. "Type checking" is the one universal rule here — it
> applies to any Quest that uses TypeScript, regardless of type. "Default
> stack" and "Folder structure" for cli/script Quests are not yet
> defined (see "Out of scope").
> Status: active

## Purpose
Defines how a Quest is structured internally, independent of what the Quest
does: default stack, folder layout, layering rules, and the type-safety
guarantee that layering depends on. This Guild is foundational to several
others that already assume it — the Testing/QA Guild's 80% coverage
threshold is scoped to `/lib` specifically because this Guild defines `/lib`
as pure logic; the Data Guild's generated Prisma client keeps `/lib` code
type-safe against the schema specifically because this Guild requires
TypeScript. This Guild also closes the Ops/Infra Guild's "Type check"
pipeline step (previously an open gap in that Guild) — see "Type checking"
below. Consulted by Loremaster during architecture design — part of
`/quest-embark`, alongside the Data Guild (AI/Agents Guild,
"Orchestration model — three Quest-phase skills") — and by any agent
facing a scaffold or structural decision throughout a Quest's lifetime.
Where the Architect's own design output is saved is not this Guild's rule
to define — see the AI/Agents Guild's "Standard agent output locations"
(Loremaster row) for that.

## Rules

### Extensibility over premature optimization at `/quest-embark`
Architecture is designed once per Quest, by Loremaster, inside
`/quest-embark` — before any feature has a Feature Brief (AI/Agents
Guild, "Orchestration model — three Quest-phase skills"). At that point,
only the loose, one-to-two-sentence entries in `docs/feature-backlog.md`
exist (Product/Ideation Guild, "Feature backlog format"); the detailed
scope, acceptance criteria, and edge cases for any given feature aren't
written until that feature's own `/quest-forge <feature>` invocation,
which may happen long after `/quest-embark` and in whatever order the
developer chooses, not an order the backlog itself fixes. Architecture
decided as if the backlog were already fully specified is architecture
decided on information that doesn't exist yet.
- **Favor extensibility over optimizing for the features already known
  in detail.** At `/quest-embark` time, that's usually none of them — the
  backlog is intentionally shallow. A structural choice that's
  technically cleaner for one specific, well-understood feature but
  closes off directions the backlog otherwise gestures at is the wrong
  trade at this stage.
- **Data models should not assume a closed set of use cases.** Prefer
  shapes that can absorb a new backlog entry as a new table, relation, or
  field rather than a redesign — e.g. a more generic entity with a
  `type` discriminator over a hand-tailored table per anticipated
  feature, when the backlog names several loosely related feature ideas
  that plausibly share a shape. This does not override the Data Guild's
  own modeling conventions — it's a bias to apply within them.
- **Avoid rigid couplings that only make sense for the first feature
  actually implemented.** The first `/quest-forge` invocation after
  `/quest-embark` will inevitably be the one the architecture gets tested
  against first; that doesn't make it the architecture's only intended
  consumer. A module boundary, a fixed enum, or an API shape that
  hard-codes assumptions true only of that first feature is exactly the
  premature optimization this rule warns against.
- **Flag it in `docs/architecture.md` when a decision might need
  revisiting.** When Loremaster makes a call it isn't fully confident
  will hold once a specific backlog entry is detailed, it says so
  explicitly in the document itself — not only in conversation — naming
  which decision, and, where identifiable, which backlog entry could be
  the one that forces a revisit. A later `/quest-forge` invocation that
  hits exactly that flagged tension has a documented reason to route the
  conflict back through the same channel this Guild already uses for any
  other architecture deviation (see "Default stack" below), instead of
  silently working around it or silently overriding the original design.
- **This is a bias, not a mandate to over-engineer.** Extensibility for a
  backlog that's still just one-to-two-sentence entries is about leaving
  reasonable room, not designing a maximally generic system against every
  conceivable future feature — that would be its own premature-
  optimization mistake, just aimed at flexibility instead of performance.
  Loremaster still exercises judgment about how far "reasonable room"
  extends for a given backlog.
> Enforcement: agent-reviewed — whether a given decision actually favored
> extensibility, versus over-fit a specific feature or over-engineered
> for a hypothetical one, is a judgment call; `/quest-embark`'s human
> Checkpoint (AI/Agents Guild) is the backstop, and a flagged decision
> that turns out wrong at a later `/quest-forge` is a `guild-proposals.md`
> candidate if the same shape would recur across Quests.

### Default stack
- Next.js (App Router) + TypeScript is the standard for web-app Quests —
  validated in the MVP (master spec, section 9) and the only stack
  combination this Guild currently defines.
- No separate backend service unless the Quest Brief explicitly requires
  one — Next.js API Routes are the default for server-side logic, avoiding
  the operational overhead of a second deployable service for problems a
  single Next.js app already solves.
- A different stack (a different framework, a standalone backend service)
  is only justified when the Quest Brief states a specific technical reason
  the default doesn't fit — the same "stated reason, not silent default"
  pattern the Data Guild uses for its own database choice. Choosing a
  different stack is a deviation from this Guild's default, which the
  AI/Agents Guild's Architect authority rule requires flagging explicitly
  at `/quest-embark`'s Checkpoint rather than deciding unilaterally — see
  that Guild for the Architect's decision authority itself; it isn't
  redefined here.
> Enforcement: agent-reviewed — whether a stated deviation is actually
> justified is a judgment call.

### Folder structure (web-app)
- `/app` — routes and pages (App Router).
- `/components` — reusable UI components.
- `/lib` — pure business logic (functions, calculations) — no UI, no React
  imports. This is the layer the Testing/QA Guild's 80% coverage threshold
  is scoped to, and the layer the Data Guild's generated Prisma client
  keeps type-safe.
- Test files are not a separate entry in this list: per the Testing/QA
  Guild's file organization rule, they're co-located next to the source
  file they test (`.test.ts` / `.test.tsx` in the same directory), not
  mirrored into a parallel `/tests` tree. This Guild's folder structure
  does not redefine that rule — it simply doesn't contradict it.
- This layout currently covers web-app Quests only; other Quest types
  (CLI, script) don't yet have a defined default folder layout (see "Out
  of scope").
> Enforcement: automated (custom) — a setup script checks these
> directories exist after scaffold.

### Separation of concerns
Business logic must live in `/lib`, never directly inside a UI component
(`/components` or `/app`).
- **Why**: keeps logic testable independent of rendering — validated
  directly in the MVP (master spec, section 9), where separating pure
  logic from UI eased both implementation and test generation. It's also
  what makes the Testing/QA Guild's `/lib`-scoped coverage threshold
  meaningful in the first place: coverage on pure functions is a real
  signal, coverage on rendering-heavy UI code is a much weaker one, which
  is why that Guild does not impose the same blanket threshold there.
> Enforcement: automated (custom) — a dependency-cruiser rule forbidding
> `/components` files from containing non-trivial computation (flagged
> for agent review, not a hard block yet).

### Client vs Server Components
Mark a component `"use client"` only where interactivity (state, event
handlers, browser-only APIs) is required. Everything else defaults to a
Server Component.
- **Why**: Server Components are the App Router default for a reason —
  less JavaScript shipped to the browser, and data fetching that can
  happen server-side without an extra client-server round trip. Defaulting
  a component to `"use client"` "just in case" quietly opts a whole
  subtree out of that benefit.
> Enforcement: agent-reviewed.

### Type checking
Closes the Ops/Infra Guild's "Type check" pipeline step, which defines
*where* `tsc --noEmit` runs in CI but explicitly left the rule itself
unclaimed.
- TypeScript runs in `strict` mode (`"strict": true` in `tsconfig.json`)
  for every Quest using the default stack — this is not optional or
  left to per-Quest configuration.
- **Why this Guild, not Code Style**: the Code Style Guild owns linting
  and formatting — surface-level conventions that don't change program
  behavior. Type strictness is different: it's what makes this Guild's
  own layering guarantees (pure `/lib`, a typed boundary between `/lib`
  and the UI, the Data Guild's typed Prisma client) actually enforceable
  at compile time instead of just a convention agents are trusted to
  follow. Ownership follows the guarantee it backs.
- The check itself (`tsc --noEmit`) executes as its own CI job — that
  remains the Ops/Infra Guild's pipeline to define (run order, what
  blocks a deploy); this Guild owns only the rule that types must be
  checked and how strictly.
> Enforcement: automated — `tsc --noEmit` as a CI job (Ops/Infra Guild's
> pipeline), failing the build on any type error. `strict: true` presence
> in `tsconfig.json` is checked by a scaffold-time script.

### Persistence decisions
Whether a Quest needs a database at all is decided during architecture
design, inside `/quest-embark`, by Loremaster, consulting this Guild
together with the Data Guild — not by this Guild alone, and not
automatically for every Quest. This Guild does not restate the Data
Guild's own standards (database choice, ORM, migrations, modeling
conventions) — see that Guild for those. The Architect's decision
authority itself — what it can decide unilaterally versus what needs to
be flagged at the Checkpoint — is defined by the AI/Agents Guild and is
not redefined here. Because this decision is made before any feature has
a Feature Brief, it's exactly the kind of call "Extensibility over
premature optimization at `/quest-embark`" above governs — see that rule
for what favoring extensibility means concretely for data-model choices.
> Enforcement: agent-reviewed — see the AI/Agents Guild's "Agent roles
> and decision authority" for the Architect's authority boundary.

## Out of scope

**Real gap, not a conscious decision:** the manifest lists this Guild as
applying to `cli` and `script` Quests, but the content only covers
web-app/api Quests on the default Next.js stack:
- **Default stack for cli and script Quests** — no default (runtime,
  language, entry-point convention) has been chosen for a cli or script
  Quest; "Default stack" above only names Next.js + TypeScript.
- **Folder structure for non-web-app Quest types** — only the web-app
  layout is defined; a CLI Quest's default layout isn't standardized.

Both are silent only because no Quest of that type has been built yet,
not because narrowing scope here was a deliberate call — the same kind of
honestly-labeled gap as the `tsc` ownership question this Guild just
closed in the Ops/Infra Guild, before it was closed. Worth a
`guild-proposals.md` entry once a cli or script Quest is actually
attempted, rather than guessed at now with no real Quest to validate
against.

**Conscious minimum-scope decisions**, by contrast — deliberately not yet
covered:
- **Monorepo / multi-package structure** — every Quest so far is a single
  deployable app; no workspace tooling (Turborepo, Nx, pnpm workspaces)
  is standardized.
- **State management library** (Redux, Zustand, Jotai, etc.) — not
  opinionated; a Quest that needs one states it in its own Quest Brief.
- **API contract conventions beyond "use Next.js API Routes"** (REST
  resource naming, versioning, GraphQL, tRPC) — this Guild defines
  *where* server-side logic lives, not the shape of the contract itself.
- **UI component/design system standard** — the UX/Frontend Guild is now
  active and has answered this: a design system stays deliberately out of
  its own scope too, starting with tokens only until a component repeats
  consistently across 2-3 Quests with a UI (see that Guild's "Out of
  scope," "Design system / reusable component library"). This Guild
  stops at the Client/Server Component boundary, not visual component
  structure, and that boundary is unchanged by the UX/Frontend Guild's
  answer.

These four are candidates for a future revision of this Guild once real
Quests surface a concrete need, not something to re-propose from scratch
via `guild-proposals.md` — that generalization test already passed when
this Guild was scoped.

## Enforcement maturity
The "Separation of concerns" dependency-cruiser rule is the clearest
maturity candidate: it already runs as an `automated (custom)` check today
but is deliberately flagged for agent review rather than a hard CI block,
per its own Enforcement line — promoting it to a hard failure is a tooling
decision away, not a redesign, once its false-positive rate is proven low
across a few real Quests. "Default stack," by contrast, is a weaker
candidate: whether a stated deviation is actually *justified* depends on
reading the Quest Brief's stated reason, the same judgment call the Data
Guild's equivalent "Default database" rule makes — though whether a reason
was stated at all, versus silence, is a mechanical presence check that
could be scripted well before that judgment ever automates.

## Proposal log
Proposals affecting this Guild are tracked per-Quest in `guild-proposals.md`
and reviewed via the `review-proposals` CLI command. See the master spec,
section 6.

## Changelog
- **0.1.10** (2026-08-26) — Added "Extensibility over premature
  optimization at `/quest-embark`": architecture is now designed once,
  before any feature has a Feature Brief (AI/Agents Guild's
  three-phase orchestration model — `/quest-embark`, `/quest-forge
  <feature>`, `/quest-ship`), so decisions must favor extensibility
  over optimizing for the handful of features already known in detail
  at that point. Concretely: data models should not assume a closed
  set of use cases, rigid couplings that only suit the first
  implemented feature should be avoided, and Loremaster must flag in
  `docs/architecture.md` itself when an early decision may need
  revisiting once a specific backlog entry is detailed later. Also
  replaced stale references to the retired step-numbered flow
  ("development flow step 3," "the Checkpoint (step 4)") in Purpose,
  "Default stack," "Type checking," and "Persistence decisions" with
  the corresponding skill names, and cross-linked "Persistence
  decisions" to the new rule. Evidence: process change following
  calculator-quest retrospective, 2026-08-25.
- **0.1.4** (2026-08-25) — Purpose now cross-references the AI/Agents
  Guild's new "Standard agent output locations" (Loremaster row) for
  where the Architect's design output is saved, instead of leaving the
  location undefined. Evidence: calculator-quest, step 3 (Loremaster).
  Tracked under the shared `guilds/manifest.json` version — see the root
  `CHANGELOG.md` and the README's "Adding or editing a guild" section for
  the versioning convention.
