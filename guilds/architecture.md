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
below. Consulted by the Architect agent during architecture design
(development flow step 3, alongside the Data Guild) and by any agent facing
a scaffold or structural decision throughout the flow.

## Rules

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
  at the Checkpoint (step 4) rather than deciding unilaterally — see that
  Guild for the Architect's decision authority itself; it isn't redefined
  here.
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
  remains the Ops/Infra Guild's pipeline to define (step 4, run order,
  what blocks a deploy); this Guild owns only the rule that types must be
  checked and how strictly.
> Enforcement: automated — `tsc --noEmit` as a CI job (Ops/Infra Guild's
> pipeline), failing the build on any type error. `strict: true` presence
> in `tsconfig.json` is checked by a scaffold-time script.

### Persistence decisions
Whether a Quest needs a database at all is decided during architecture
design (development flow step 3) by the Architect agent, consulting this
Guild together with the Data Guild — not by this Guild alone, and not
automatically for every Quest. This Guild does not restate the Data
Guild's own standards (database choice, ORM, migrations, modeling
conventions) — see that Guild for those. The Architect's decision
authority itself — what it can decide unilaterally versus what needs to
be flagged at the Checkpoint — is defined by the AI/Agents Guild and is
not redefined here.
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
- **UI component/design system standard** — belongs to the (still-draft)
  UX/Frontend Guild once active (master spec, section 11); this Guild
  stops at the Client/Server Component boundary, not visual component
  structure.

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
