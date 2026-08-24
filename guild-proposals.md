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
