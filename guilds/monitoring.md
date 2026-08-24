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
  Analytics / Speed Insights (opt-in, free tier, one toggle at scaffold
  time) for response time and traffic.
- An external APM tool (Sentry, Datadog, etc.) is not a default — only
  add one if the Quest Brief states a specific reliability requirement
  that the Vercel-native metrics don't cover.
> Enforcement: automated (custom) — a scaffold script enables Vercel
> Analytics on the project; agent-reviewed for whether a given Quest
> needs more than that.

### Healthcheck
- Every Quest with a deploy target exposes a `/api/health` route
  returning `200` with a minimal JSON body (`{ status: "ok" }`, optionally
  a commit SHA) — cheap to build, and it gives an unambiguous "is it up"
  signal instead of guessing from the homepage, which can render `200`
  even when something underneath it is broken.
- This checks that the app process itself is responding — it does not
  check downstream dependencies (database, third-party APIs). Deeper
  dependency healthchecks are deferred to the Data Guild once it exists
  (see "Out of scope").
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
> Enforcement: agent-reviewed for the diagnosis; agent-recommended,
> human-confirmed for proposing and taking any corrective action.

## Out of scope
This Guild deliberately does not yet cover:
- **APM / distributed tracing** (Datadog, New Relic, OpenTelemetry) — not
  needed at the current single-service, single-developer scale.
- **On-call rotation or paging** (PagerDuty or equivalent) — there is no
  team to page.
- **SLA/SLO definitions** — no external customers to promise uptime to.
- **Dashboards beyond what Vercel provides by default.**
- **Dependency-aware healthchecks** (verifying the database or a
  third-party API is reachable, not just that the app process responds)
  — belongs with the Data Guild once it exists.
- **Post-incident documentation format** — how an incident gets written
  up after the fact belongs with the Documentation Guild, which is still
  a draft; this Guild only defines the detection/response boundary, not
  the write-up.

This is a conscious minimum-scope decision for the current stage of the
project, not an oversight — these are candidates for a future revision of
this Guild once real Quests surface a concrete need, not something to
re-propose from scratch via `guild-proposals.md`.

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
