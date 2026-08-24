# Documentation Guild

> Applies to: all Quests
> Note: the "Post-incident documentation" rule below applies only to
> Quests with a deploy target (web-app, api), matching the Monitoring
> Guild's own scope — a CLI/script Quest has no running incident to write
> up.
> Status: active

## Purpose
Defines how a Quest documents itself once it exists: the minimum shape of
its README, when a decision made during implementation earns a standalone
Architecture Decision Record instead of living only in the Quest Brief,
how an incident gets written up after the fact, and when code needs a
comment versus when the code should simply read clearly on its own. This
Guild also closes the Monitoring Guild's "Post-incident documentation
format" item (Out of scope), which named this Guild as the eventual
owner. Consulted by the Docs agent at the final step of the development
flow (spec section 5, step 12), and by any agent — most often Ops — that
needs to write an ADR or an incident doc at the point the underlying
decision or incident actually happens, rather than waiting for step 12.

## Rules

### README format
Every Quest ships a `README.md` at its root with these sections, in
order. A section is omitted only when it plainly doesn't apply (e.g. no
"Deployment" section for a CLI/script Quest with no deploy target, per
the Ops/Infra Guild's own applicability line):
1. **Title + one-line description** — what the Quest does, in one
   sentence.
2. **Quest Brief link** — a pointer to the Quest's own requirements
   document (e.g. `docs/quest-brief.md`), not a restatement of it. The
   Quest Brief is the source of truth for *what* was requested; the
   README is not a second copy that can drift out of sync with it.
3. **Getting started** — prerequisites, install command, required
   environment variables (referencing `.env.example`, per the Ops/Infra
   Guild), and the command to run the Quest locally.
4. **Available scripts** — the lint, test, and build commands (Code
   Style and Testing/QA Guilds), so a reader doesn't have to open
   `package.json` to find them.
5. **Deployment** — the production URL if one exists, and a one-line
   note that every PR gets its own preview deployment (Ops/Infra Guild).
   Omitted for Quests with no deploy target.
6. **Architecture notes** — a pointer to `/docs/adr/` if the Quest has
   any ADRs (see below), rather than re-explaining structure the
   Architecture Guild already standardizes.
> Enforcement: automated (custom) — a scaffold script generates the
> README with these headings already in place; a CI check can verify the
> headings still exist. Whether the content under each heading is
> actually accurate and useful is agent-reviewed.

### ADR format — when a decision earns one
An Architecture Decision Record captures a decision made *during*
implementation (development flow steps 5-8) that a future reader of the
code could not reconstruct just by reading the Quest Brief or the diff.
Not every implementation decision qualifies — most don't.

Use this test, in order:
1. **Does it describe what to build, decided at or before the Checkpoint
   in step 4?** → It already belongs in the Quest Brief. Do not duplicate
   it as an ADR.
2. **Is it a deviation from a Guild default** — the Architect choosing a
   different stack, database, or structural pattern than the Architecture
   or Data Guild's default — **that was flagged and confirmed at a
   Checkpoint**, per the AI/Agents Guild's authority boundary for the
   Architect role? → Write an ADR. The confirmation already happened in
   conversation; the ADR is what keeps the reasoning attached to the code
   after that conversation is gone.
3. **Is it a choice among real technical alternatives with a tradeoff**
   (not just "which is the default," since the core Guilds already fixed
   those) **made during implementation, and reversing it later would be
   costly or non-obvious**? → Write an ADR.
4. **Otherwise** — the decision is reversible, low-stakes, or already
   obvious from reading the code and its types → no ADR. If the WHY still
   isn't obvious from the code, a single code comment is enough (see
   "Code documentation" below); most decisions need neither.

An ADR is not a substitute for a `guild-proposals.md` entry, and the two
are not mutually exclusive: an ADR records a decision specific to *this*
Quest; a proposal records a candidate rule that would generalize to other
Quests (AI/Agents Guild's "Logging a `guild-proposals.md` entry"). The
same decision can warrant both — write the ADR for this Quest's record,
and separately apply the generalization test to decide if it also belongs
in the proposal log.

Format, stored at `/docs/adr/NNNN-short-title.md` (zero-padded sequential
number, e.g. `0001-use-sqlite-for-cache.md`):
```markdown
# ADR NNNN: <title>

## Status
Proposed | Accepted | Superseded by ADR-000X

## Context
<what situation forced this decision, and what was actually at stake>

## Decision
<the decision itself, stated plainly>

## Consequences
<what this makes easier, what it makes harder, what it forecloses>
```
> Enforcement: agent-reviewed for whether a given decision clears the
> bar above; automated (custom) for file placement and sequential
> numbering (a script checks `/docs/adr/` files are numbered without
> gaps or duplicates).

### Post-incident documentation
Closes the Monitoring Guild's "Post-incident documentation format" item.
Applies only to Quests with a deploy target (web-app, api) — matching
the Monitoring Guild's own scope, since a CLI/script Quest has no running
process to have an incident in.

- **Trigger** — any incident the Monitoring Guild's "Incident response"
  rule detected and diagnosed, whether or not it ultimately required a
  human-confirmed corrective action.
- **What to document**, in one file:
  - **Timeline** — when it was detected, when it was diagnosed, when a
    corrective action was taken (if any), when it resolved.
  - **Root cause** — one paragraph: what actually broke and why, per the
    Ops agent's diagnosis.
  - **Impact** — what was affected and for how long (e.g. "healthcheck
    failing for 12 minutes; no user-facing downtime, since stale cached
    responses kept serving").
  - **Follow-up** — the fix that shipped, and whether the incident
    surfaced a gap worth a `guild-proposals.md` entry under the
    AI/Agents Guild's generalization test (e.g. a Guild rule that would
    have caught this earlier).
- **Level of detail** — personal-project scale, not an enterprise
  postmortem: a single markdown file is enough. No blameless-culture
  ceremony, no stakeholder sign-off section — just enough for future-you
  to understand what broke and why without re-diagnosing it from scratch.
- **Where it lives** — `/docs/incidents/YYYY-MM-DD-short-title.md`,
  inside the Quest's own repository (not the guildhall repository) —
  it's part of that Quest's production history and stays with it even if
  the Quest is later archived.
- **Who writes it, and when** — the Ops agent, immediately after the
  incident resolves, using this Guild's format. It is not deferred to the
  Docs agent's step-12 pass: an incident can happen at any point after
  deploy (development flow step 11), not only right before step 12 runs,
  and the diagnosis is freshest immediately after resolution.
> Enforcement: agent-reviewed — both whether an incident clears the
> trigger and whether the write-up is complete enough are judgment calls.

### Code documentation
This Guild does not introduce a separate commenting policy — it applies
the Code Style Guild's "no dead code" rule and general philosophy
(comment the WHY, never the WHAT) to the specific question of when a
comment is required at all:
- A comment is warranted only when it captures something the code itself
  cannot: a hidden constraint, a subtle invariant, a workaround for a
  specific bug, or behavior that would genuinely surprise a reader.
- A comment that restates what well-named identifiers and types already
  say is not documentation — it's noise, and it rots the moment the code
  changes underneath it.
- **`/lib` doc-comments** — an exported function in `/lib` (the pure
  business logic layer consumed by both UI and tests, per the
  Architecture Guild) gets a brief JSDoc comment only when its contract
  isn't fully captured by its name and TypeScript types alone — e.g. a
  precondition the caller must uphold, a non-obvious edge case in its
  return value, or the unit of a numeric value. This documents the
  contract, not the implementation.
- The Code Style Guild's language policy applies without exception:
  every comment and doc-comment is in English, same as code and commit
  messages (master spec, section 8).
> Enforcement: agent-reviewed — the Reviewer agent's existing checklist
> (Code Style Guild, step 8) is extended to flag both a missing comment
> where the WHY is genuinely non-obvious, and a comment that only
> restates the code.

### Applicability to the guildhall repository itself
This Guild's rules describe how a *Quest* documents itself; they do not
govern the guildhall repository's own documentation (this file, `spec.md`,
or any other Guild). Guildhall's self-documentation is produced by the
interactive Guild-authoring process already described in the AI/Agents
Guild — a prompt describing the change, a draft, human review and
revision, human approval before commit — which already satisfies the
same intent this Guild exists for, the same way that process is carved
out of the AI/Agents Guild's "Editing an active Guild" rule. There is no
separate guildhall-specific documentation standard to define here; the
existing authoring process already is one.
> Enforcement: agent-reviewed — the same judgment the AI/Agents Guild
> already applies to that authoring loop.

## Out of scope
This Guild deliberately does not yet cover:
- **Documentation site generators** (Docusaurus, VitePress, or
  equivalent) — a Quest's docs live as plain markdown in its own repo;
  no rendered site is standard yet.
- **Auto-generated API reference docs** (OpenAPI/Swagger UI, TypeDoc) —
  not needed at the current scale of a personal-project API surface.
- **A CHANGELOG.md convention** per Quest — commit history (Conventional
  Commits, per the Code Style Guild) is the record for now.
- **Diagramming conventions** (architecture diagrams, sequence diagrams)
  — no standard tool or format has been chosen yet.
- **Translation / i18n of documentation** — the language policy (master
  spec, section 8) is English-only; there is no multi-language docs need
  to address.

This is a conscious minimum-scope decision for the current stage of the
project, not an oversight — these are candidates for a future revision of
this Guild once real Quests surface a concrete need, not something to
re-propose from scratch via `guild-proposals.md`.

## Enforcement maturity
The README section-presence check already matured directly into
`automated (custom)` above, the same way the "component has a test file"
check did in the Testing/QA Guild — checking that a heading exists is
mechanical, even though the content under it stays agent-reviewed. Of the
rules still fully `agent-reviewed`, "Post-incident documentation" is the
next-best partial candidate: whether an incident cleared the Monitoring
Guild's detection/diagnosis path at all is a mechanical presence check
(did an alert fire, did a healthcheck fail) that could be scripted to
remind the Ops agent a write-up is due, before the deeper judgment of
whether that write-up is *complete enough* ever automates. The ADR-worthy
test, by contrast, is a poor maturity candidate: deciding whether a
technical alternative was a "real tradeoff" depends on reading intent
behind a specific decision, the same way the Data Guild's expand/contract
compatibility judgment does.

## Proposal log
See the master spec, section 6.
