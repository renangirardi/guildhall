# Guild proposals — guildhall

Unlike a Quest's own `guild-proposals.md` (which logs candidate rules for
*Quests* built from these Guilds), this file logs proposals about the
guild mechanism itself — the CLI, the manifest, the cross-guild
synchronization tooling, and the authoring process defined in the
AI/Agents Guild. See the master spec, section 6, for the entry format and
review flow; this file follows the same discipline, applied one level up.

An item only belongs here once there's real evidence behind it — a gap
noticed in passing during a guild revision, with no concrete instance
that exposed it, stays a note in that guild's own "Out of scope" section
instead of an entry here. See, for example, the Architecture Guild's
"Real gap" on cli/script default stack: explicitly deferred from this log
until a real cli/script Quest is attempted, not guessed at now.

---

## Proposal: Extend cross-guild synchronization to also cover a Guild referencing `docs/spec.md`, not only another Guild

**Affected Guild**: AI/Agents Guild — "Cross-guild synchronization" rule

**Context**: During the "Out of scope" audit that split every core/
conditional Guild's deferred items into "Real gap" vs. "Conscious
minimum-scope decision" (guildhall, 2026-08-25), the AI/Agents Guild's
own "Out of scope" section was found pointing at a decision that no
longer existed as open: it named "Multi-agent orchestration mechanics"
as "an explicitly open decision in the master spec (section 11), not
settled here." But `docs/spec.md` section 5.1 ("Orquestração dos agentes
— decisão tomada," session 2026-08-24) had already resolved exactly this
— the day before the audit — without `guilds/ai-agents.md` ever being
updated to match. The "Cross-guild synchronization" rule as written only
covers one Guild closing a gap left open by *another Guild's* "Out of
scope" line; it says nothing about the same staleness risk when the
thing that changed underneath a Guild's forward reference is
`docs/spec.md` itself rather than a sibling Guild. That's exactly what
happened here: the master spec closed the gap, no Guild was the one
doing the closing, and the AI/Agents Guild's own text was left pointing
at a decision that had already been made. It was caught by the same kind
of human review the existing rule already relies on as its backstop, not
by the automated check — which, as written, has no reason to even look
at `docs/spec.md` for a matching update.

**Proposed rule**: Extend "Cross-guild synchronization" (and, if
feasible, its `automated (custom)` check) to also apply when a Guild's
"Out of scope" section (or any rule) forward-references a `docs/spec.md`
section as the place a decision will be or was made — not only a
sibling Guild file. Whenever a diff to `docs/spec.md` resolves a
decision that some Guild's text names as pending in a specific spec
section, that Guild should be updated in the same commit, the same
discipline already required guild-to-guild. The existing check's scan
pattern ("belongs to Guild X", "owned by Guild X") would need a matching
pattern for spec references (e.g. "master spec, section N", "docs/
spec.md section N") to catch this mechanically; short of that, it's at
least worth naming explicitly as part of the rule's judgment-call scope
so an agent or reviewer knows to check for it.

**Evidence**: guildhall, "Out of scope" reclassification session
(2026-08-25) — see `guilds/ai-agents.md`'s "Out of scope" section before
this session's fix, which named `docs/spec.md` section 11 as the home of
an open decision that section 5.1 had already resolved on 2026-08-24.

**Generalization test**: Applies the same way regardless of which Guild
or which spec section is involved — any Guild that names a `docs/
spec.md` section as "not yet decided" carries the same risk of going
stale the moment that section of the spec is actually resolved, since
nothing today ties a spec edit back to the Guild files that reference it.
This is the same shape of problem "Cross-guild synchronization" already
solves for Guild-to-Guild references, just with the master spec as the
other end of the pointer instead of a sibling Guild.

**Status**: Open — not yet promoted. Whether to extend the existing
automated check's regex or leave this as an `agent-reviewed` addition to
the rule's text is a design choice for whoever picks this up; either way,
the AI/Agents Guild's own "Out of scope" text has already been corrected
for this specific instance (2026-08-25) — this proposal is about closing
the general pattern, not the one instance that surfaced it.

---

## Proposal: Tighten the cross-guild synchronization check to require a positive back-reference, not just a touched file

**Affected Guild**: AI/Agents Guild — "Cross-guild synchronization" rule

**Context**: The rule's `automated (custom)` check verifies that a Guild
file referenced by another Guild's "Out of scope" line ("belongs to
Guild X once it exists") was touched in the same diff that closes the
gap. During the Documentation Guild's authoring, this passed a case it
shouldn't have: the Monitoring Guild's "Post-incident documentation
format" line was correctly removed from "Out of scope," but no
back-reference to the Documentation Guild's actual rule was added
anywhere else in `monitoring.md` — the file was touched, so the check
would have passed, even though the synchronization was incomplete. It
was caught by human review, not by the automated check, and fixed in a
follow-up revision.

**Proposed rule**: The check should require a positive match for the
closing Guild's name (or a link to the specific rule) somewhere in the
origin file's diff — not merely confirm that the file changed. A line
removed with nothing added in its place should fail the check, the same
way a line removed and replaced with an unrelated edit should.

**Evidence**: guildhall, Documentation Guild authoring session
(2026-08-24) — see `guilds/ai-agents.md`, "Cross-guild synchronization,"
which already documents this limitation inline as a known gap.

**Generalization test**: Applies the same way regardless of which two
Guilds are involved — any time one Guild's gap-closing diff only removes
the forward-reference without adding a real pointer back, the check's
blind spot is identical. This is exactly the kind of repeatable,
mechanical pattern the rule itself exists to catch in Guild content; it
should catch it in its own tooling too.

**Status**: Open — not yet promoted. Tightening the script requires
deciding what counts as a "real pointer" in a way that doesn't just trade
one loophole for another (e.g. a Guild name mentioned incidentally,
without an actual rule reference, would technically match a naive
name-search). Revisit before writing the stricter check.

---

## Proposal: Enforce Quartermaster's rollback stop-and-confirm gate at the tool level, not by instruction alone

**Affected Guild**: AI/Agents Guild — "When to apply
`agent-recommended, human-confirmed`", and the Ops/Infra Guild's Rollback
rule / Monitoring Guild's Incident response rule that instantiate it.

**Context**: While authoring `templates/claude/agents/` (Phase 1 of the
agent-orchestration work referenced in `docs/spec.md`, section 11), the
Warden subagent's `tools:` frontmatter omits `Write`/`Edit` entirely,
which makes "Warden doesn't fix code itself" a real tool-level guarantee
rather than only a prompt instruction. Quartermaster's rollback gate
couldn't get the same treatment: it needs `Bash` to run a routine deploy
(an action its own authority permits alone), but that same `Bash` grant
also technically permits `vercel rollback` or a deployment-promotion
command — the one action the Ops/Infra Guild explicitly reserves for
`agent-recommended, human-confirmed`. Checked directly against Claude
Code's actual subagent format: the `tools:` field only grants/withholds
whole tools, with no syntax for restricting `Bash` to a command-pattern
allowlist (e.g. `Bash(vercel deploy:*)` while excluding
`vercel rollback`). `settings.json`'s `permissions.allow`/`deny` rules do
support that pattern syntax, but they apply project-wide, not scoped to
one subagent — using them to block `vercel rollback` for Quartermaster
would also block it for every other agent, which isn't the actual
constraint being enforced (routine deploys, run by Quartermaster, are
fine; unconfirmed rollback, by anyone, isn't). The only mechanism that
could enforce this mechanically today is a `PreToolUse` hook running a
command-validation script — technically real, but a separate deliverable
(an external script, cross-platform shell concerns) from a single
self-contained subagent template file, so it wasn't built as part of this
pass. `quartermaster.md`'s "Stop-and-confirm gate" section documents this
limitation explicitly rather than leaving it implicit.

**Proposed rule**: Once a Quest actually exercises this path (a real
rollback scenario with a real Quartermaster agent), author a `PreToolUse`
hook — either as a companion file shipped alongside
`templates/claude/agents/quartermaster.md`, or documented as a
recommended addition in the Ops/Infra Guild's Rollback rule — that
inspects any `Bash` call attempting `vercel rollback` (or an equivalent
promotion command) and blocks it unless a human-confirmation signal is
present, closing the gap between "Warden's tool-level guarantee" and
"Quartermaster's instruction-only gate."

**Evidence**: guildhall, `templates/claude/agents/` authoring session
(2026-08-24) — see `templates/claude/agents/quartermaster.md`,
"Stop-and-confirm gate," which documents this limitation inline.

**Generalization test**: Applies to any future subagent whose routine
authority requires a tool (`Bash`, or any other) that also happens to
grant access to a different, higher-stakes action gated
`agent-recommended, human-confirmed` under the same tool name — not
specific to Quartermaster or to Vercel's CLI. The same shape would recur
for, e.g., a database-migration agent whose `Bash` access to run
migrations also technically permits a destructive `prisma migrate reset`.

**Status**: Open — not yet promoted. Revisit once a real Quest exercises
Quartermaster's rollback path, or once `PreToolUse` hook authoring
conventions exist elsewhere in this project to build on, rather than
designing the hook script speculatively now.

---

## Proposal: Extend `guildhall init`/`update` to also copy the agent-orchestration templates, not just Guild files

**Affected Guild**: AI/Agents Guild — "Out of scope," multi-agent
orchestration mechanics (deferred to `docs/spec.md` section 11); and the
guildhall CLI's `init`/`update` commands (`bin/cli.js`).

**Context**: While authoring `templates/claude/skills/quest-flow/
SKILL.md` (Phase 2 of the agent-orchestration work), the skill needs
three things to already exist inside a Quest's own repository: the seven
subagent templates at `.claude/agents/*.md`, the skill itself at
`.claude/skills/quest-flow/SKILL.md`, and the agent applicability
manifest at `.claude/quest-manifest.json` (a copy of this repository's
`templates/manifest.json`, which the skill reads at runtime to decide
whether Quartermaster applies to a given Quest's type). Checked
`bin/cli.js` directly: `cmdInit`/`selectGuilds` only copy `guilds/*.md`
per `guilds/manifest.json` — there is no equivalent step for anything
under `templates/`. Getting the three prerequisites above into a Quest
today is a manual, undocumented step; nothing in the CLI, the AI/Agents
Guild, or `docs/spec.md` currently says where they should land or how
they get there.

**Proposed rule**: Extend `cmdInit` (and `cmdUpdate`) to also copy
`templates/claude/agents/*.md` to `<quest>/.claude/agents/`,
`templates/claude/skills/*` to `<quest>/.claude/skills/`, and
`templates/manifest.json` to `<quest>/.claude/quest-manifest.json`
(filename open to revision), the same way Guild files are copied today.
Unlike Guild selection, this likely doesn't need per-Quest-type gating —
each agent/skill already knows its own applicability internally (see
`templates/manifest.json`'s `appliesTo`/`conditionalByType` fields and
each agent template's own applicability checks) — but that's a detail to
settle when this is actually implemented, not decided here.

**Evidence**: guildhall, `templates/claude/skills/quest-flow/` authoring
session (2026-08-24) — see `SKILL.md`, "Prerequisites — and a gap this
exposed," which documents this limitation inline.

**Generalization test**: Applies identically regardless of which Quest
is being initialized — any Quest that wants to use the agent-
orchestration flow hits this same missing-wiring gap, since it's a
property of the CLI, not of a specific Quest's content.

**Status**: Open — not yet promoted. This is squarely the "level of
orchestration automation" question `docs/spec.md` section 11 already
lists as undecided (scripts vs. per-agent slash commands vs. a full
orchestrator) and that `guilds/ai-agents.md` explicitly keeps out of its
own scope. Wiring the CLI copy step is a small, low-risk slice of that
larger open decision and could reasonably be built without resolving the
whole question — revisit once section 11 settles, or sooner if a real
Quest tries to use `quest-flow` and hits the gap directly.

**Resolution (2026-08-24)**: Promoted and implemented in `bin/cli.js`
(guildhall orchestration Phase 3). `cmdInit` now copies
`templates/claude/agents/*.md` to `<quest>/.claude/agents/`,
`templates/claude/skills/*` to `<quest>/.claude/skills/` (recursively,
unconditionally — the orchestrator skill applies to every Quest type),
and `templates/manifest.json` to `<quest>/.claude/quest-manifest.json`
in full (unfiltered, so the quest-flow skill can read any agent's
`appliesTo` at runtime). `cmdUpdate` mirrors the existing guild
version-diff logic, but against a separate `agentTemplatesVersion` field
in `.guildhall-lock.json` — kept independent from `guildhallVersion`
since the two manifests (`guilds/manifest.json`,
`templates/manifest.json`) version on their own schedules and shouldn't
force each other's refresh. One point where implementation diverged from
this proposal's own speculation: agent *files* (not the manifest) **are**
gated by `appliesTo`, the same way guilds are — `quartermaster.md` is
simply not copied into a `cli`/`script` Quest, rather than relying only
on Quartermaster's own internal applicability check. This mirrors how
the project already treats guilds that don't apply (e.g. `ops-infra.md`
for `cli`/`script`) and gives the manifest-level narrowing
`templates/manifest.json` already documents for Quartermaster a real
tooling backstop, not just an instruction. `.guildhall-lock.json` also
moved from `<quest>/guilds/.guildhall-lock.json` to `<quest>/
.guildhall-lock.json` (Quest root), since it now tracks more than guild
content and nesting it under `guilds/` would misstate its scope — no
migration path was written, since no real Quest predates this change.
Verified with a real `guildhall init` run against scratch directories
for both a `web-app` type (all 7 agents installed, including
Quartermaster) and a `cli` type (6 agents, Quartermaster correctly
omitted), plus an `update` run confirming independent version tracking.
