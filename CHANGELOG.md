# Changelog

All notable changes to the Guilds distributed by this repository are
logged here, keyed to the `version` field in `guilds/manifest.json`
(`guildhallVersion` once installed into a Quest via `.guildhall-lock.json`
— see `bin/cli.js` and the master spec, section 7). Agent-template
changes (`templates/manifest.json`, `agentTemplatesVersion`) are tracked
independently and are not in scope for this file. When a change also
touches the `guildhall` CLI mechanism itself (`bin/cli.js`), the CLI's
own `package.json` `version` is noted in that entry — it is a third,
independent number from the two above, since `package.json` versions the
npm package/CLI tool, not any Guild or agent-template content.

## [0.1.14] - 2026-08-30

### Changed
- **Architecture Guild** (`0.1.10` → `0.1.11`) — added "External
  dependencies — mocking and the integration contract": when a Quest
  depends on another application or service that doesn't exist yet
  (any direction — a frontend needing a backend, an API needing another
  API, a CLI needing a service), Loremaster decides the mocking strategy
  at `/quest-embark`, the same authority split "Persistence decisions"
  already uses for the Data Guild. Default strategy is static fixtures
  at `mocks/` (Quest root) behind a thin `/lib` data-access wrapper that
  switches to a real network call once the dependency's base URL is
  configured — not a network-interception library, which is a
  stated-reason deviation from the default, same pattern as "Default
  stack." Introduces `docs/integration-contract.md`: a skeleton written
  by Loremaster at `/quest-embark`, filled in incrementally by Artificer
  per feature at `/quest-forge` (one entry per operation the feature
  needs from the dependency, written from the same shape as that
  feature's fixture data, kept in sync by Warden's per-feature check),
  and deliberately formatted to double as a ready-made "idea" input for
  a future `/quest-embark` on the dependency itself. Updated "Out of
  scope" 's "API contract conventions" bullet to note the new rule only
  narrows the cross-Quest-dependency case, not this Quest's own exposed
  API shape.
- **AI/Agents Guild** (`0.1.9` → `0.1.10`) — "Standard agent output
  locations" gained rows for `docs/integration-contract.md` (Loremaster,
  skeleton) and `mocks/` plus incremental contract entries (Artificer,
  scaffold + per-feature) — both conditional on Herald having flagged an
  external dependency. "Agent roles and decision authority" 's Architect
  row now names the mocking-strategy decision explicitly, with the same
  deviation-flagging treatment as the default stack.
- **Product/Ideation Guild** (`0.1.10` → `0.1.11`) — "Vision Mode
  intake," point 5 ("Known constraints"), now explicitly asks whether
  this Quest depends on another, not-yet-built application or service —
  the input the Architecture Guild's new rule needs from Herald before
  Loremaster can apply it.
- **Documentation Guild** (`0.1.11` → `0.1.12`) — "README format,"
  "Getting started," now notes when a Quest depends on another
  not-yet-built application, pointing at `mocks/` and
  `docs/integration-contract.md` instead of restating them.

No agent-template or skill change in this entry — Loremaster and
Artificer already read the Architecture Guild in full before acting
(same as how they already pick up "Persistence decisions" without
`/quest-embark`'s `SKILL.md` needing to call it out specifically), so
`agentTemplatesVersion` (`templates/manifest.json`) is untouched at
`0.1.3`, and so is `package.json`.

Evidence: developer feedback that a Quest depending on another, not-yet-
built application had no standard way to stay independently testable in
the meantime, and no standard way to hand that dependency's requirements
to whoever builds it next, 2026-08-30.

## [0.1.13] - 2026-08-30

### Changed
- **AI/Agents Guild** (`0.1.8` → `0.1.9`) — added "Per-agent Checkpoints
  — a human approval after every step, in every skill": a Checkpoint now
  follows every named agent's completed work in all three Quest-phase
  skills, with no exceptions — every agent handoff (including
  Herald → Loremaster and Loremaster → Artificer inside `/quest-embark`,
  which previously ran straight through to one combined Checkpoint), the
  `/quest-forge` fix-retry cycle after a flagged Warden review (a
  Checkpoint after each pass through Artificer/Sentinel/Warden, not an
  unattended loop), and the last agent in each skill (which previously
  ended the skill's turn without a dedicated approval of its own — a
  phase/feature/deploy's `status` now only reaches `done` once that last
  Checkpoint is actually approved). Retires the old combined Quest Brief
  + architecture Checkpoint at the end of `/quest-embark` in favor of two
  separate ones (after Herald, after Loremaster); `/quest-ship`'s
  pre-deploy scope Checkpoint is unchanged and now sits alongside two new
  ones, after Quartermaster and after Scribe. Reworked "Orchestration
  model" 's per-skill bullets and its Checkpoint-count paragraph to point
  at the new rule instead of describing "two kinds of point." Reworked
  "`.quest-progress.json` — schema for the three-phase model"
  (`version` `"2.0"` → `"3.0"`): `foundation`, every `features[]` entry,
  and every `deploys[]` entry now carry a `steps` object tracking each
  involved agent's own `status`/`checkpoint` individually; a phase's or
  feature's overall `status` only reaches `done` once every one of its
  `steps` entries does, and a fix-retry cycle overwrites the previous
  pass's recorded state rather than accumulating a per-attempt history.
  See `guilds/ai-agents.md`.
- **`templates/claude/skills/quest-embark/SKILL.md`,
  `quest-forge/SKILL.md`, `quest-ship/SKILL.md`**
  (`agentTemplatesVersion` `0.1.2` → `0.1.3`) — all three rewritten to
  insert an explicit Checkpoint after every agent they orchestrate
  (`quest-embark`: after Herald, after Loremaster, after Artificer;
  `quest-forge`: after Herald, after Artificer, after Sentinel, after
  Warden, including every pass through the fix-retry cycle;
  `quest-ship`: after Quartermaster, after Scribe, alongside the
  unchanged pre-deploy scope Checkpoint). "Resuming" logic in all three
  now locates the first `steps.<agent>` entry that isn't `{ "status":
  "done", "checkpoint": "approved" }` and resumes exactly there, instead
  of the old single-phase-level `checkpoint` field check.
- **`guilds/product-ideation.md`** — small precision fix, cross-guild-
  synchronized with the above (folded into the existing `0.1.10`
  changelog entry rather than a new version bump): two enforcement notes
  in "Vision Mode intake" and "Herald's authority" that said "checkable
  at `/quest-embark`'s Checkpoint" now say "checkable at Herald's own
  Checkpoint," since the combined Checkpoint they originally referenced
  no longer exists.

Evidence: developer feedback that agent reports were getting lost in a
large conversation because the next agent had already started acting on
one before a human had a real chance to read it, 2026-08-30.

## [0.1.12] - 2026-08-30

### Changed
- **Product/Ideation Guild** (`0.1.9` → `0.1.10`) — added "Vision Mode
  intake — a fixed round of questions before drafting": `/quest-embark`'s
  Herald no longer infers the Quest Brief's content by default and asks
  only when something is genuinely ambiguous. It now always asks the
  developer a fixed, six-point round (problem/audience, type, v1
  boundaries, definition of done, known constraints, explicit non-goals)
  as a single short numbered list before writing `docs/quest-brief.md` or
  `docs/feature-backlog.md`, every time, regardless of how complete the
  original idea looks. "Herald's authority: what it infers versus what it
  asks" was reworked so its ambiguity-triggered "asks the developer first"
  model now scopes to **Feature Brief Mode only** (`/quest-forge`, which
  is unchanged); "`type` as a default to confirm" and "When an idea (or a
  feature) is too vague to become a brief yet" were updated to reference
  the new round for Vision Mode instead of a single clarifying question.
  See `guilds/product-ideation.md`.
- **`templates/claude/skills/quest-embark/SKILL.md`**
  (`agentTemplatesVersion` `0.1.1` → `0.1.2`) — Herald's delegation brief
  now explicitly instructs the subagent to run the Guild's new Vision Mode
  intake round and end the turn waiting for the developer's answers before
  drafting anything, the same "brief the subagent with current-model
  terms at delegation time" pattern this skill already uses to work around
  `herald.md` not yet being rewritten for the three-phase model (its own
  text still says "never a full intake form," which this delegation brief
  now overrides for Vision Mode specifically). "How the Checkpoint
  actually 'pauses'" and "Resuming" were both updated to cover this
  turn-ending wait as the same no-special-mechanism pattern used
  elsewhere in this skill, one step earlier than the Checkpoint itself.

Evidence: developer feedback that Herald's agents in `/quest-embark` were
deciding too much unilaterally and the resulting Quest Brief sometimes
didn't reflect what was actually wanted, 2026-08-30.

## [agentTemplatesVersion 0.1.1 / cli 0.3.0] - 2026-08-26
This entry doesn't bump `guildhallVersion` (`guilds/manifest.json` stays
at `0.1.11`, unchanged) — it's the first entry in this file that's
purely an agent-template / CLI-mechanism change, logged here anyway per
explicit instruction even though this file's own header above says such
changes are "tracked independently." No dedicated agent-template
changelog exists yet to track them instead.

### Changed
- **`bin/cli.js`** (`package.json` `0.2.0` → `0.3.0`) — `cmdInit` now
  also scaffolds `docs/feature-backlog.md` and `docs/features/README.md`
  the same way it already scaffolds `guild-proposals.md` and
  `process-gaps.md`: written once at `init`, never overwritten by
  `update`, since both become living Quest documents the moment Herald
  starts writing to them (Product/Ideation Guild, "Feature backlog
  format" and "Feature Brief format"). The stale comment describing
  `quest-flow` as "the orchestrator" copied unconditionally is replaced
  with one describing the three Quest-phase skills
  (`quest-embark`/`quest-forge`/`quest-ship`) that already replaced it
  — the actual copy logic (`copyDirRecursive` over
  `templates/claude/skills/`) needed no functional change, since it was
  already generic over whatever skill directories exist rather than
  hardcoding `quest-flow` by name. The `init`/`update` help text is
  updated to match. Verified with a scratch `init` + `update` run: the
  three new skills install and re-sync correctly, and a developer-added
  line in `docs/feature-backlog.md` survives `update` untouched.
- **`templates/manifest.json`** (`agentTemplatesVersion` `0.1.0` →
  `0.1.1`) — bumped for the skill-set change above (`quest-flow`
  retired, `quest-embark`/`quest-forge`/`quest-ship` are what `init`/
  `update` now install), per this repository's convention that
  `agentTemplatesVersion` moves independently of `guildhallVersion` and
  only when an agent template or skill actually changes.

Evidence: process change following calculator-quest retrospective,
2026-08-25 — replaces `/quest-flow` with `/quest-embark`,
`/quest-forge`, `/quest-ship`.

## [0.1.11] - 2026-08-26

### Changed
- **Documentation Guild** — added "Incremental updates — Scribe's
  cadence at `/quest-ship`": since `/quest-ship` is repeatable and
  on-demand (AI/Agents Guild's three-phase orchestration model — see the
  `[0.1.8]` entry above and `guilds/ai-agents.md`), Scribe no longer
  produces one final documentation pass at a single step. Each
  `/quest-ship` run now scopes its README (and other governed docs)
  update to only the features that run's `.quest-progress.json`
  `deploys` entry lists in `featuresIncluded`, updates the existing
  document in place rather than rewriting it from scratch, and never
  assumes it's the last such pass the Quest will see. "README format"
  itself is unchanged — only the cadence and scope of updating it are.
  Also replaced stale references to the retired step-numbered flow with
  the corresponding skill names throughout Purpose, "ADR format",
  "Post-incident documentation", and "Code documentation". Evidence:
  process change following calculator-quest retrospective, 2026-08-25.
  See `guilds/documentation.md`.

## [0.1.10] - 2026-08-26

### Changed
- **Architecture Guild** — added "Extensibility over premature
  optimization at `/quest-embark`": since architecture is now designed
  once, before any feature has a Feature Brief (AI/Agents Guild's
  three-phase orchestration model — see the `[0.1.8]` entry above and
  `guilds/ai-agents.md`), decisions must favor extensibility over
  optimizing for the few features already known in detail. Concretely:
  data models should not assume a closed set of use cases, rigid
  couplings that only suit the first implemented feature should be
  avoided, and Loremaster must flag in `docs/architecture.md` itself
  when an early decision may need revisiting once a specific backlog
  entry is detailed later. Also replaced stale references to the
  retired step-numbered flow with the corresponding skill names in
  Purpose, "Default stack," "Type checking," and "Persistence
  decisions," and cross-linked "Persistence decisions" to the new rule.
  Evidence: process change following calculator-quest retrospective,
  2026-08-25. See `guilds/architecture.md`.

## [0.1.9] - 2026-08-26

### Changed
- **Product/Ideation Guild** — reworked for the AI/Agents Guild's three-
  phase orchestration model (`/quest-embark`, `/quest-forge <feature>`,
  `/quest-ship` — see the `[0.1.8]` entry below and
  `guilds/ai-agents.md`). Added "Herald's two modes: Vision Mode and
  Feature Brief Mode": Vision Mode (`/quest-embark`, once per Quest)
  produces a deliberately incomplete Quest Brief — vision, `type`,
  general app-level success criteria, no feature-by-feature acceptance
  criteria — plus a loose `docs/feature-backlog.md` (one to two sentences
  per candidate feature, tagged `planned` / `in-progress` / `done`).
  Feature Brief Mode (`/quest-forge <feature>`, repeatable) produces a
  complete, detailed Feature Brief for exactly one feature — full
  acceptance criteria, scope, edge cases — at `docs/features/<slug>.md`,
  whether that feature came from the backlog or was described fresh by
  the developer. Added new "Feature backlog format" and "Feature Brief
  format" rules; updated "Quest Brief format," "Acceptance criteria must
  be verifiable," "Explicit 'out of scope'," "Herald's authority"
  (renamed from "Product agent authority"), and "When an idea (or a
  feature) is too vague" to cover both documents/modes. Made explicit
  that "`type` as a default to confirm" is unchanged by this
  restructuring — `type` stays fixed once by `init` and confirmed only
  inside `/quest-embark`, never re-asked by `/quest-forge`. Evidence:
  process change following calculator-quest retrospective, 2026-08-25.
  See `guilds/product-ideation.md`.

## [0.1.8] - 2026-08-26

### Changed
- **AI/Agents Guild** — reworked "Agent roles and decision authority"
  and "Standard agent output locations" to describe the new three-phase
  orchestration model instead of the retired twelve-step linear flow:
  `/quest-embark` (once per Quest — Herald's Quest Brief and
  `docs/feature-backlog.md`, Loremaster's architecture, a human
  Checkpoint, Artificer's scaffold), `/quest-forge <feature>` (repeatable
  — Herald's per-feature Brief at `docs/features/<slug>.md`, Artificer's
  implementation, Sentinel's tests, Warden's review), and `/quest-ship`
  (repeatable/on-demand — a Checkpoint over everything built since the
  last deploy, Quartermaster's deploy and monitoring, Scribe's
  incremental documentation update). Added a new "Orchestration model —
  three Quest-phase skills" section and a new "`.quest-progress.json` —
  schema for the three-phase model" section (`foundation` / `features` /
  `deploys`, with a worked example), and made explicit that the human
  Checkpoint now recurs at two *kinds* of point — end of `/quest-embark`,
  and every `/quest-ship` run — rather than two fixed one-time steps.
  The three new skills themselves (`templates/claude/skills/quest-embark/`,
  `quest-forge/`, `quest-ship/`) and the retirement of `/quest-flow` are
  out of scope for this change — tracked separately. Evidence: process
  change following calculator-quest retrospective, 2026-08-25. See
  `guilds/ai-agents.md`.

## [0.1.7] - 2026-08-25

### Added
- **AI/Agents Guild**, **`bin/cli.js`**, and the guildhall CLI package
  itself (`package.json` `0.1.0` → `0.2.0`) — a new `process-gaps.md`
  mechanism, distributed to every Quest by `guildhall init` the same way
  `guild-proposals.md` already is. `guild-proposals.md`'s existing
  "Chronicle" only captures a finding when an agent affirmatively
  concludes it generalizes into a candidate Guild rule; it never covered
  the case where an agent identifies something real but concludes acting
  on it or proposing a rule isn't its scope right now — that
  conclusion previously lived only as an implicit note in
  `.quest-progress.json`, if anywhere. The AI/Agents Guild's new
  "Logging a `process-gaps.md` entry" makes logging that conclusion
  mandatory. `guildhall review-proposals` now prints both
  `guild-proposals.md` and `process-gaps.md` from every scanned Quest, in
  separate, clearly labeled sections — the two aren't reviewed the same
  way, since a process gap has no accept/reject rule decision behind it.
  No severity tag (incident vs. note) yet — deliberately left open until
  the mechanism has seen real use. Evidence: calculator-quest, steps 8
  (Warden) and 11 (Quartermaster). See `guilds/ai-agents.md`,
  `bin/cli.js`, and `README.md`.

## [0.1.6] - 2026-08-25

### Fixed
- **Monitoring Guild** — "Metrics" now specifies the actual scaffold-time
  integration behind Vercel Web Analytics and Speed Insights:
  `@vercel/analytics` and `@vercel/speed-insights` installed as
  dependencies, with `<Analytics />` and `<SpeedInsights />` rendered in
  the root layout by Artificer at scaffold (steps 5-6). The prior text
  described this as "one toggle at scaffold time," but no package
  install or code integration actually backed it, so no data reached the
  dashboard. Any one-time manual enablement Vercel itself requires in the
  project dashboard is now explicitly a developer action Artificer
  reports, not performs. Scaffold-default change for future Quests only
  — not applied retroactively. Evidence: calculator-quest, step 11
  (Quartermaster). See `guilds/monitoring.md`.

## [0.1.5] - 2026-08-25

### Fixed
- **Ops/Infra Guild** — added "Framework Preset: vercel.json and step-10
  verification" near "Deploy platform": Vercel auto-detects the
  Framework Preset from whatever's on `main` at the moment the project
  is connected, and a connection made before real Next.js code exists
  silently pins it to `Other` — a platform-configuration failure no
  code-quality CI gate can catch, since it only surfaces at Vercel's own
  deploy step ("No Output Directory named 'public' found"). Fixed going
  forward with a committed `vercel.json` (`{"framework": "nextjs"}`)
  added to the scaffold by default, and backstopped by a new Ops agent
  (Quartermaster) check: a one-time, read-only `vercel project inspect
  <name>` the first time step 10 runs against a Quest with real
  application code already present. Evidence: calculator-quest, step 10
  (Quartermaster). See `guilds/ops-infra.md`.

## [0.1.4] - 2026-08-25

### Added
- **AI/Agents Guild** and **Architecture Guild** (cross-guild
  synchronization, same commit) — the AI/Agents Guild gains a new
  "Standard agent output locations" table mapping every flow agent
  (Herald, Loremaster, Artificer, Sentinel, Warden, Quartermaster,
  Scribe) to its expected output location — `docs/quest-brief.md` for
  Herald, `docs/architecture.md` for Loremaster (newly formalized here),
  the Quest's own source tree for Artificer, co-located test files for
  Sentinel, `README.md`/`/docs/adr/` for Scribe, `/docs/incidents/` for a
  Quartermaster-triggered write-up, and "not yet standardized" for
  Warden's output — an honest gap rather than a guess. This replaces the
  ad hoc `docs/architecture.md`
  convention calculator-quest used at step 3 with no Guild to point at.
  The Architecture Guild's Purpose now cross-references the new
  Loremaster row instead of leaving the Architect's output location
  undefined. Evidence: calculator-quest, step 3 (Loremaster). See
  `guilds/ai-agents.md` and `guilds/architecture.md`.

## [0.1.3] - 2026-08-25

### Fixed
- **Product/Ideation Guild** and **AI/Agents Guild** (cross-guild
  synchronization, same commit) — the Product/Ideation Guild's "Product
  agent authority" now states that a Quest's `type`, already fixed in
  `.guildhall-lock.json` at `init` before the Product agent (Herald) is
  even invoked at step 2, is treated as a default to confirm against the
  received idea rather than decided from scratch: if it matches, the
  agent proceeds; if not, it logs the conflict in the Quest Brief's
  "Open questions / assumptions" for the step 4 human Checkpoint to
  resolve, instead of blocking. The AI/Agents Guild's "Agent roles and
  decision authority" now cross-references that rule from the Product
  agent's entry rather than duplicating it. Evidence: calculator-quest,
  step 2 (Herald). See `guilds/product-ideation.md` and
  `guilds/ai-agents.md`.

## [0.1.2] - 2026-08-25

### Documented
- **UX/Frontend Guild** — "Default token values" now flags that the
  default `border` token (`#3f3f46`) does not clear the 3:1 non-text
  contrast floor "Accessibility baseline (WCAG AA)" requires against
  `background` (`#18181b`) — a known gap (~1.7:1), documented rather than
  fixed by changing the shipped value. A Quest relying on `border` as a
  visible component boundary must verify that color pair independently.
  Evidence: calculator-quest, step 6 (Artificer). See
  `guilds/ux-frontend.md`.

## [0.1.1] - 2026-08-25

### Fixed
- **Testing/QA Guild** — "Default framework" now requires the
  `vite-tsconfig-paths` plugin in `vitest.config.mts` (so the `@/*` alias
  from `tsconfig.json` resolves instead of being silently unresolved) and
  an explicit `afterEach(() => cleanup())`, importing `cleanup` from
  `@testing-library/react`, in `vitest.setup.ts` (so DOM state doesn't
  leak between tests in the same file). Evidence: calculator-quest, step
  7 (Sentinel). See `guilds/testing-qa.md`.

## [0.1.0] - 2026-08-25

Initial versioned baseline: 11 Guilds (core + conditional) plus the
agent-orchestration templates, distributed via the `guildhall` CLI
(`init` / `update` / `review-proposals`).
