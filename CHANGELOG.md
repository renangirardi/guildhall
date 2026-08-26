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
