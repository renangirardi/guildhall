# Monitoring/Observability Guild

> Applies to: Quests with a deploy target (web-app, api)
> Not applicable to: CLI and script Quests — nothing runs continuously
> after the process exits, so there's nothing to observe in production.
> Status: active

## Purpose
Defines what a Quest logs, what it measures, how its liveness is checked,
what triggers an alert, and how an agent is allowed to react to an
incident. This is where the Ops/Infra Guild's "Out of scope" line — it
stops at "the deploy succeeded" — gets picked up: this Guild covers
everything from that point on, while the Quest is actually running.
Consulted by the Ops agent post-deploy (development flow step 11).

## Rules

### Logging
- Logs are structured (JSON), not free-form text — `{ timestamp, level,
  message, context }` at minimum — so they stay parseable if ever piped
  into a tool later, even though today they're just read from Vercel's
  Runtime Logs. No dedicated logging library is required at this stage;
  `console.log`/`console.error` emitting a JSON string is enough, since
  Vercel captures stdout/stderr automatically.
- Three levels only: `info` (normal operation), `warn` (a recoverable
  anomaly — e.g. a retried external call), `error` (something failed and
  needs attention).
- Never log a secret, credential, token, or full raw request body. This
  is the logging-side extension of the Security Guild's rule against
  committing secrets: a secret that never touches git but ends up in
  plaintext logs is exposed all the same.
> Enforcement: agent-reviewed for level/format judgment; automated
> (custom) for the "never log secrets" rule — a script scans source for
> logging calls that reference `process.env` or known secret-like
> variable names directly.

### Metrics
- Minimum expected: error rate and response time, per the Quest's
  functions/routes.
- At this stage, use what Vercel already provides for free rather than
  adding an external tool: Vercel's Runtime Logs and per-function
  invocation/error/duration metrics (dashboard, no setup) plus Vercel Web
  Analytics and Speed Insights for response time and traffic.
- **Scaffold-time integration, not a dashboard toggle.** The scaffold
  (development flow steps 5-6) installs `@vercel/analytics` and
  `@vercel/speed-insights` as dependencies and adds `<Analytics />`
  (from `@vercel/analytics/next`) and `<SpeedInsights />` (from
  `@vercel/speed-insights/next`) to the root layout. This is code the
  Builder agent (Artificer) writes as part of the scaffold, the same way
  it writes the health route below — not a manual step the developer
  performs later. This Guild previously described the item as "one
  toggle at scaffold time," but the actual scaffold never installed the
  packages or wrote the components, so the toggle alone had no data to
  show. Evidence: calculator-quest, step 11 (Quartermaster).
- If Vercel itself ever requires a one-time manual enablement in the
  project dashboard before this data appears, that follows the same
  pattern this Guild's own "Alerts" rule already uses for the uptime
  monitor signup below: a manual, one-time action outside what an agent
  can perform, stated plainly to the developer as part of finishing the
  scaffold rather than left silently undone.
- An external APM tool (Sentry, Datadog, etc.) is not a default — only
  add one if the Quest Brief states a specific reliability requirement
  that the Vercel-native metrics don't cover.
> Enforcement: automated (custom) — a scaffold-time script checks
> `@vercel/analytics` and `@vercel/speed-insights` are present in
> `package.json` and that the root layout imports and renders both
> components, the same check style as the healthcheck route below;
> agent-reviewed for whether a given Quest needs more than that, and for
> whether any Vercel-side manual enablement was actually necessary and
> reported.

### Healthcheck
- Every Quest with a deploy target exposes a `/api/health` route
  returning `200` with a minimal JSON body (`{ status: "ok" }`, optionally
  a commit SHA) — cheap to build, and it gives an unambiguous "is it up"
  signal instead of guessing from the homepage, which can render `200`
  even when something underneath it is broken.
- This checks that the app process itself is responding — it does not
  check downstream dependencies on its own. For a Quest with a database,
  the Data Guild extends this same route with a connectivity check
  rather than adding a separate one — see that Guild's "Dependency-aware
  healthcheck" rule.
- `/api/health` is not exempt from the Testing/QA Guild's API/route layer
  rule just because it's infrastructure rather than a product feature —
  it needs the same integration test (call the handler, assert on status
  code and response shape) as any other route.
> Enforcement: automated (custom) — a scaffold script generates the
> health route by default. The route's test coverage is enforced the
> same way as any other route under the Testing/QA Guild.

### Alerts
- Realistic for a personal project with exactly one person to notify: no
  on-call rotation, no paging, no team channel.
- **Deploy failures** — Vercel emails the connected account automatically
  on a failed deploy; this needs no extra configuration beyond having the
  GitHub integration connected (already required by the Ops/Infra Guild).
- **Runtime issues** (the app is up but unhealthy or erroring) — a free
  external uptime monitor (e.g. UptimeRobot or equivalent) polls
  `/api/health` on an interval (default: every 5 minutes) and emails the
  developer on failure. This is the full extent of alerting for now.
- Signing up for the uptime monitor service itself is a one-time manual
  step the developer does once, outside any Quest — an agent cannot
  create the account. Once that account exists, its API key/credential
  follows the same rule as any other secret in the Ops/Infra Guild:
  never hardcoded, always an environment variable configured on the
  deploy platform. There is no implicit exception to the Security
  Guild's secrets rule just because the credential belongs to a
  monitoring tool rather than the Quest's own stack.
> Enforcement: automated (custom) — but only for per-Quest monitor
> configuration via the service's API, once the account exists (a
> scaffold step registers `/api/health` with the monitor). Creating the
> uptime monitor account itself is a manual, one-time action by the
> developer, done once outside any Quest — not something this Guild's
> automation can perform. Adjusting threshold/frequency per Quest away
> from the default is agent-reviewed.

### Incident response
- When the Ops agent detects an incident (an alert firing, a healthcheck
  failure, or a visible error-rate spike in logs), it diagnoses before
  proposing anything: check Runtime Logs and correlate the incident's
  start time against the most recent deploy to establish whether a
  deploy caused it.
- If the diagnosis points to a bad deploy, the agent may propose a fix —
  typically the rollback described in the Ops/Infra Guild — but does not
  execute it. This is the same `agent-recommended, human-confirmed`
  boundary the Ops/Infra Guild's Rollback rule uses at the point of
  execution; it applies here too, one step earlier, at the point of
  *deciding to act*. The agent's diagnosis (what broke, and why) is a
  judgment call; whether to act on it is not the agent's call to make
  alone.
- Once the incident is resolved, the write-up follows the Documentation
  Guild's "Post-incident documentation" rule — timeline, root cause,
  impact, and follow-up. The Ops agent writes it immediately after
  resolution, the same agent that diagnosed and responded to the
  incident, not deferred to the Docs agent's step-12 pass in the
  development flow.
> Enforcement: agent-reviewed for the diagnosis; agent-recommended,
> human-confirmed for proposing and taking any corrective action.

## Out of scope

**Real gap, not a conscious decision:**
- **Third-party API reachability in the healthcheck** — the Data Guild
  extended `/api/health` with a database-connectivity check
  ("Dependency-aware healthcheck" above), but checking a third-party API
  dependency the same way is still undefined, with no stated reason it
  was left out — it simply hasn't been built yet.

Worth a `guild-proposals.md` entry once a Quest that actually depends on
a third-party API for its core function needs this, rather than guessed
at now with nothing to validate against.

**Conscious minimum-scope decisions:**
- **APM / distributed tracing** (Datadog, New Relic, OpenTelemetry) — not
  needed at the current single-service, single-developer scale.
- **On-call rotation or paging** (PagerDuty or equivalent) — there is no
  team to page.
- **SLA/SLO definitions** — no external customers to promise uptime to.
- **Dashboards beyond what Vercel provides by default** — same
  personal-project-scale reasoning as the three items above; Vercel's own
  dashboards are the standard until a Quest's needs outgrow them.

These four are candidates for a future revision of this Guild once real
Quests surface a concrete need, not something to re-propose from scratch
via `guild-proposals.md`.

## Enforcement maturity
The most likely `agent-reviewed` rule to mature into `automated` (per the
master spec, section 10) is the diagnosis step in "Incident response" —
specifically, correlating an incident's start time against the most
recent deploy timestamp is a narrow, mechanical comparison that a script
could do (flag "incident started within N minutes of a deploy" as a
signal) before the broader judgment of *what actually broke and why*
ever automates. By contrast, the decision to act on that diagnosis stays
`agent-recommended, human-confirmed` by design, the same way the Ops/
Infra Guild's rollback confirmation does — that boundary exists to keep
a human in the loop for high-impact production actions, not because the
tooling to automate it is missing.

## Proposal log
See the master spec, section 6.

## Changelog
- **0.1.6** (2026-08-25) — "Metrics" now specifies that the scaffold
  (steps 5-6, Artificer) installs `@vercel/analytics` and
  `@vercel/speed-insights` and renders `<Analytics />`/`<SpeedInsights />`
  in the root layout, replacing the previous "one toggle at scaffold
  time" description that had no actual package install or code
  integration behind it, and clarifying that any Vercel-side manual
  dashboard enablement is a one-time developer action Artificer reports
  plainly, not something it performs itself. Evidence: calculator-quest,
  step 11 (Quartermaster). This is a scaffold-default change for future
  Quests only — not applied retroactively to any existing Quest. Tracked
  under the shared `guilds/manifest.json` version — see the root
  `CHANGELOG.md` and the README's "Adding or editing a guild" section for
  the versioning convention.
