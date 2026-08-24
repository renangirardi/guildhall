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
