# Code Style Guild

> Applies to: all Quests
> Scope: "Tooling" (the specific ESLint preset) and the "Components" line
> under "Naming conventions" assume the default Next.js/TypeScript
> web-app stack (Architecture Guild). Every other rule here — naming for
> functions/variables/constants, Commits, Branch naming, Language,
> Comments and dead code — applies regardless of stack. Tooling and
> component naming for a cli/script Quest are not yet defined (see "Out
> of scope").
> Status: active

## Purpose
Defines the surface-level conventions every Quest's code must follow:
tooling, naming, commit and branch format, comment discipline, and the
language every artifact is written in. "Surface-level" is a deliberate
boundary, not a vague one — the Architecture Guild's "Type checking" rule
draws the line explicitly: *"the Code Style Guild owns linting and
formatting — surface-level conventions that don't change program
behavior."* Type strictness lives in the Architecture Guild because it's
what makes that Guild's own layering guarantees enforceable at compile
time; this Guild owns everything that's a convention rather than a
guarantee. Several other Guilds already assume specific rules here hold,
rather than restating them:
- The Ops/Infra Guild's CI pipeline runs the ESLint and Prettier checks
  this Guild defines as its own "Lint" and "Format check" steps, and its
  "what blocks a deploy" list blocks on both directly — the same
  ownership split the Architecture Guild's "Type checking" and the
  Security Guild's "Dependencies" rule already established with
  Ops/Infra: this Guild owns the rule, Ops/Infra owns *where* it runs and
  what it blocks.
- The Documentation Guild's "Code documentation" rule does not define its
  own commenting philosophy — it explicitly builds on this Guild's
  comment-the-WHY-never-the-WHAT rule below, adding only the narrower
  question of when a `/lib` doc-comment is warranted.
- The AI/Agents Guild's Reviewer role (step 8) is defined as "Security +
  Code Style checklist, **including the language check**" — that's the
  Language rule below. Its "Logging a `guild-proposals.md` entry" rule
  also points here directly: a Quest-specific decision gets documented
  "inline (a code comment only if the WHY is non-obvious, per the Code
  Style Guild)."
- The Documentation Guild's own "Out of scope" defers a CHANGELOG.md
  convention to "commit history (Conventional Commits, per the Code
  Style Guild)... for now" — the Commits rule below is what that line
  points at.

Consulted by the Builder agent during scaffold and implementation
(development flow steps 5-6, alongside the Ops/Infra and Security
Guilds) and by the Reviewer agent as part of its code-review checklist
(step 8), per the AI/Agents Guild's role definitions.

## Rules

### Tooling
- ESLint (`eslint-config-next`, the Next.js default) + `eslint-config-prettier`
  to disable formatting rules that would otherwise conflict with Prettier.
- Prettier for formatting, with an explicit config committed to the repo
  rather than relying on undocumented defaults:
  `{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 80 }`
- **Why an explicit Prettier config, not defaults**: Prettier's own
  defaults have changed across major versions before; pinning the values
  in this Guild means every Quest scaffolded at any point in time
  formats identically, instead of drifting based on which Prettier
  version happened to be current at scaffold time.
- **Why `eslint-config-prettier` specifically**: this isn't a
  hypothetical concern — the MVP (master spec, section 9) hit this
  exact problem. The agent building it needed `eslint-config-prettier`
  to resolve an ESLint/Prettier rule conflict that neither tool flags on
  its own, and that need wasn't written into any Guild at the time. It's
  a baked-in lesson now, not something a future Quest should have to
  rediscover.
- **Why `eslint-config-next` as the base, not a hand-rolled rule set**:
  it ships a maintained baseline (React hooks rules, basic accessibility
  checks) for the default stack at no setup cost — the same "don't build
  what the ecosystem already solved" reasoning the Architecture Guild
  uses for defaulting to Next.js API Routes over a separate backend
  service.
> Enforcement: automated — `eslint` + `prettier --check` in CI (Ops/Infra
> Guild's pipeline, steps 4-5); both are in that Guild's blocking list.

### Naming conventions
- **Components**: PascalCase (`Calculator.tsx`), one component per file.
  - **Why PascalCase**: matches the wider React community convention, so
    a component is visually distinguishable from a regular function or
    hook at a glance without needing Guild-specific knowledge to read.
  - **Why one component per file**: the file name and the component name
    become the same fact stated twice, which is what makes the
    Architecture Guild's `/components` folder scannable by name alone —
    a file's name reliably tells you what's in it, without opening it.
- **Functions and variables**: camelCase.
- **Constants**: SCREAMING_SNAKE_CASE, reserved for true module-level
  constants that never change at runtime — not for `let` bindings, React
  state, or a config object that's merely uppercase-by-habit.
  - **Why**: a name in this casing is a signal on sight — "this value is
    fixed" — which is only true, and only useful, if the convention isn't
    diluted by applying it to things that actually do change.
- **Non-component files** (`/lib`, utility modules): lowerCamelCase
  matching the file's primary export (e.g. `calculateTotal.ts` exporting
  `calculateTotal`). This is the same convention the Testing/QA Guild's
  own file-organization example already assumes (`calculate.ts` →
  `calculate.test.ts`) — this rule makes that assumption explicit rather
  than leaving it implied by example only.
- Files under `/app` follow the Next.js App Router's own fixed naming
  (`page.tsx`, `layout.tsx`, `route.ts`) — the framework decides those
  names, not this Guild.
> Enforcement: automated — ESLint naming rules where available
> (components, casing); "one component per file" and the constants
> convention are agent-reviewed today (see "Enforcement maturity").

### Commits
Conventional Commits format: `type: description` (e.g. `feat: add session
history`, `fix: correct rounding in calculator`, `chore: bump dependency`).
Common types: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`.
- **Why**: a consistent, parseable commit format makes history scannable
  at a glance (what kind of change is this, without opening the diff),
  and it's the substrate the Documentation Guild's own "Out of scope"
  section already leans on: with no dedicated CHANGELOG.md convention
  yet, commit history *is* the changelog for now — that only works if
  the format is consistent enough to read as one.
> Enforcement: automated (custom) — commit-msg hook or CI check against
> the Conventional Commits pattern.

### Branch naming
`type/short-kebab-description`, using the same type vocabulary as
Conventional Commits above (e.g. `feat/session-history`,
`fix/rounding-error`).
- **Why this belongs here now**: the Ops/Infra Guild's CI pipeline and
  branch-protection rules already assume every change reaches `main`
  through a pull request from a named branch — that dependency exists
  today, not hypothetically. Conventional Commits already solved this
  exact "give every change-of-a-given-kind a consistent, greppable
  prefix" problem for commit messages; leaving the branch itself
  unconventioned is the same gap one level up, not a different problem.
  Reusing the same type vocabulary means the two conventions reinforce
  each other instead of introducing a second, inconsistent taxonomy to
  remember.
> Enforcement: automated (custom) — a CI check (or pre-push hook)
> validating the branch name against
> `^(feat|fix|chore|test|docs|refactor)\/[a-z0-9-]+$`.

### Language
- Every artifact in the repository must be written in English: code,
  variable/function names, comments, tests, commit messages, and
  documentation (README, Quest Brief, Guild documents, ADRs).
- Runtime-facing content (error messages, UI text) must also be in
  English.
- Conversation with the developer (chat, decision discussions) may stay
  in the developer's preferred language — it is not a repository
  artifact. This split is what the master spec's own authoring process
  runs on today (spec section 8): guild documents are drafted and
  discussed in Portuguese conversation, but every committed file is in
  English.
- **This is no longer a hypothetical policy.** When this rule was first
  written, it had zero real evidence behind it. It now has nine —
  Architecture, Security, Testing/QA, Ops/Infra, Monitoring, Data,
  AI/Agents, Documentation, and this Guild are all fully in English,
  produced through Portuguese-language authoring conversations the whole
  way. That's the concrete reference for what "every artifact" means in
  practice: prose, rule text, code samples, and file paths in English,
  with no exception carved out for a guild document just because its own
  authoring discussion wasn't.
- The Reviewer agent checks for leaked Portuguese in code, comments, and
  docs as an explicit line item of its code-review checklist (development
  flow step 8) — named directly in the AI/Agents Guild's role definition
  for Reviewer ("Security + Code Style checklist, including the language
  check") and in the master spec (section 5, step 8).
> Enforcement: automated (custom) — a CI script flags non-ASCII
> characters (catching accented Portuguese letters like `ã`, `ç`, `õ`) and
> a short list of common Portuguese stopwords (`não`, `que`, `para`, `é`)
> as a secondary heuristic, since not every leaked word carries an
> accent. This is a best-effort net, not a guarantee — a word that's
> valid in both languages, or a proper noun, won't trip it — so final
> judgment on an actual leak is agent-reviewed by the Reviewer agent.

### Comments and dead code
- **Comment the WHY, never the WHAT.** A comment is warranted only when
  it captures something the code itself can't: a hidden constraint, a
  subtle invariant, a workaround for a specific bug, or behavior that
  would genuinely surprise a reader. A comment that restates what a
  well-named identifier and its types already say isn't documentation —
  it's noise that rots the moment the code around it changes.
  - This is the general philosophy the Documentation Guild explicitly
    builds on rather than redefining: its own "Code documentation" rule
    adds only the narrower case of when an exported `/lib` function
    additionally earns a doc-comment for its contract (a precondition, a
    non-obvious return value, a unit) — it does not restate this rule.
  - Comments are code, and follow the Language rule above without
    exception: a comment explaining a workaround is not exempt just
    because it's prose rather than a variable name.
- **No dead code.** No commented-out code should be left in a commit —
  remove it or don't commit it in the first place.
  - **Why**: git history already preserves anything genuinely worth
    keeping around; commented-out code left in a file just adds a second,
    unreliable place to look, with no signal for whether it's disabled-
    on-purpose or simply forgotten.
> Enforcement: agent-reviewed. "No dead code" is a plausible future
> automated (custom) candidate (see "Enforcement maturity"); whether a
> given comment actually earns its place stays a judgment call.

## Out of scope

**Real gap, not a conscious decision:** the manifest lists this Guild as
applying to every Quest, but "Tooling" and the "Components" naming rule
only cover a web-app Quest on the default Next.js stack:
- **ESLint config and component naming for cli/script Quests** — no
  equivalent tooling setup or naming standard has been defined for a
  cli/script Quest. This traces back to the same root gap the
  Architecture Guild already flagged in its own "Out of scope": that
  Guild hasn't defined a default stack for a cli/script Quest yet, so
  this Guild has nothing concrete to configure tooling against. Worth a
  `guild-proposals.md` entry once the Architecture Guild's cli/script
  default stack gap closes and a real cli/script Quest is attempted —
  not guessed at now with no Quest to validate against.

**Conscious minimum-scope decisions**, by contrast — deliberately not yet
covered:
- **Import conventions** (ordering, absolute vs. relative paths, a
  mandated `@/*` path alias) — not standardized. No Quest has surfaced
  real friction from inconsistent import style; the MVP calculator
  (master spec, section 9) was small enough that it never came up, and
  `eslint-config-next` doesn't enforce an import order out of the box.
  Revisit once a Quest large enough to make inconsistent imports an
  actual reviewing cost is built.
- **A linting rule set stricter than `eslint-config-next` + Prettier**
  (e.g. banning `any`, enforcing exhaustive `useEffect` dependencies
  beyond the defaults) — the Architecture Guild's `strict: true`
  TypeScript requirement already covers the highest-value part of this;
  a stricter lint layer on top is not yet justified by a real Quest
  hitting a gap it would have caught.

These are candidates for a future revision of this Guild once real
Quests surface a concrete need, not something to re-propose from scratch
via `guild-proposals.md` — the same generalization discipline the
Architecture and Security Guilds' own "Out of scope" sections apply to
their deferred items.

## Enforcement maturity
"Branch naming" and "Commits" are the strongest `automated (custom)`
candidates and were implemented directly as such above rather than left
as future work — a name or message matching a fixed pattern is exactly
the kind of mechanical, script-able check the Data Guild's
point-in-time-recovery flag and the AI/Agents Guild's cross-guild
forward-reference scan both used the same reasoning for. Of the rules
still `agent-reviewed`, "one component per file" in "Naming conventions"
is the next-best candidate: detecting more than one top-level exported
component in a single `.tsx` file is a narrow, mechanical check, the
same shape as the "component has a test file" rule that already matured
in the Testing/QA Guild. "No dead code" is a plausible but weaker
candidate — a heuristic (consecutive comment-prefixed lines that parse
as valid syntax) can flag likely dead code, but distinguishing that from
an intentionally-commented example or snippet still needs a human look.
The Language rule's split is already about as automated as it can get:
the non-ASCII/stopword scan is `automated (custom)` today, but telling a
genuine leaked word from a proper noun or an English word that happens
to trigger the heuristic is the same kind of judgment call the Security
Guild's `NEXT_PUBLIC_` name heuristic runs into — likely to stay a
flag-for-review check indefinitely, not a hard block. "Comment the WHY,
never the WHAT," by contrast, is not a maturity candidate at all: whether
a specific comment earns its place depends on reading intent, the same
way the Documentation Guild's own ADR-worthiness test does.

## Proposal log
See the master spec, section 6.
