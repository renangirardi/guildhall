# Data Guild

> Applies to: web-app and api Quests that need persistent data storage
> (declared in the Quest Brief)
> Not applicable to: Quests with no persistence need — this Guild defines
> the standard for *when* a Quest needs a database, it does not mandate
> that every Quest have one (the MVP calculator, for example, needed
> none). Also not applicable to CLI/script Quests.
> Status: active

## Purpose
Defines the standard database, migration strategy, modeling conventions,
and backup/retention approach for any Quest that needs persistent
storage. This Guild also closes two items explicitly deferred here by
other Guilds: the Ops/Infra Guild's "Database migrations" (Out of scope)
and the Monitoring Guild's "Dependency-aware healthchecks" (Out of
scope) — both are now real rules below, not placeholders. Consulted by
the Architect agent during architecture design (development flow step 3)
whenever the Quest Brief calls for persistence.

## Rules

### Default database
- Vercel Postgres (built on Neon) is the standard choice when a Quest
  needs a relational database — it integrates with the default Next.js +
  Vercel stack (Architecture Guild, Ops/Infra Guild) with no extra
  friction: the connection string is auto-populated as an environment
  variable when linked to the Vercel project, and it supports an
  isolated database branch per PR, mirroring the Ops/Infra Guild's
  preview-per-PR environment strategy.
- A different database (NoSQL, a different Postgres host, etc.) is only
  justified when the Quest Brief states a specific technical reason
  relational Postgres doesn't fit — it is not a default choice.
> Enforcement: agent-reviewed — whether Postgres fits, and whether a
> stated alternative is actually justified.

### ORM and migrations
- Prisma is the standard ORM and migration tool: schema lives in
  `schema.prisma`, and the generated TypeScript client keeps `/lib` code
  (Architecture Guild) type-safe against the actual schema.
- A schema change is made by editing `schema.prisma` and generating a
  migration locally (`prisma migrate dev`); the generated migration
  folder (`/prisma/migrations`) is committed to git in the same PR —
  migrations are code, versioned like everything else.
- Migrations are **forward-only**. Prisma does not auto-generate a down-
  migration, and this Guild does not ask for one: reverting a schema
  mistake means writing a new migration that undoes it, not running an
  undo script against production. This is a deliberate simplicity
  choice — down-migrations quietly drift from reality; a new forward
  migration is always accurate because it's tested the same way the
  original one was.
- Because the Ops/Infra Guild's rollback promotes old application code
  without reverting the database schema, a migration must stay
  compatible with the previous deploy's code until that old code is no
  longer reachable (expand, then contract: add new columns/tables in one
  migration; only remove the old ones in a later migration, once nothing
  still depends on them). A rollback must never leave the running app
  pointed at a schema it doesn't understand.
> Enforcement: automated (custom) — CI checks that `/prisma/migrations`
> is committed whenever `schema.prisma` changed in the same PR.
> Expand/contract compatibility is agent-reviewed.

### Modeling conventions
- Table names: plural, `snake_case` (`users`, `order_items`).
- Column names: `snake_case`.
- Primary key: `id`, UUID — not an auto-increment integer. Avoids leaking
  sequential record counts and avoids collisions when seeding a preview
  branch database from another environment's data.
- Every table has `created_at` and `updated_at` timestamps, set and
  maintained by the database itself (`DEFAULT now()`, an update trigger
  or Prisma's `@updatedAt`) — not by application code, so they stay
  accurate even for a write that bypasses the app.
> Enforcement: automated (custom) — a schema lint script checks every
> Prisma model for an `id`, `created_at`, `updated_at` field and
> `snake_case` mapping (`@@map`/`@map`).

### Backup and retention
- Realistic for a personal project, not an enterprise one: rely on the
  managed provider's built-in backups (Vercel Postgres/Neon includes
  automatic point-in-time recovery, including on the free tier) instead
  of building custom backup tooling.
- No retention policy beyond the provider's default is required. A Quest
  with a specific compliance or retention need states it in its own
  Quest Brief — that's a Quest-specific decision, not a Guild default.
> Enforcement: automated (custom) — a scaffold script queries the
> provider's API for the linked database and fails if point-in-time
> recovery is not enabled; the same check re-runs periodically (e.g. a
> scheduled CI job) since a project can be reconfigured after scaffold.

### Migrations in CI/CD
Closes the Ops/Infra Guild's "Database migrations" item.
- `prisma migrate deploy` runs as its own CI/CD job, positioned after
  Build (Ops/Infra Guild pipeline, step 8) and before the deploy is live,
  applying pending migrations to the target database as part of the
  merge-to-`main` pipeline.
- A failed migration is a **blocking** failure, added to the Ops/Infra
  Guild's "What blocks a deploy" list — code must never go live pointed
  at a schema it doesn't match.
- Preview deployments run migrations against an isolated preview branch
  database (not production), so a schema change can be reviewed at the
  pre-deploy Checkpoint (development flow step 9) without touching real
  data.
> Enforcement: automated — the migration job is part of the CI/CD
> pipeline defined by the Ops/Infra Guild; its failure blocks merge and
> deploy the same way any other blocking job does.

### Dependency-aware healthcheck
Closes the Monitoring Guild's "Dependency-aware healthchecks" item.
- The existing `/api/health` route (Monitoring Guild) is extended, not
  duplicated: when a Quest has a database, the handler also runs a
  trivial query (e.g. `SELECT 1`) against it with a short timeout, and
  reports `db: "ok" | "unreachable"` in the response body alongside the
  existing `status` field.
- A database-unreachable result makes `/api/health` itself respond with
  a non-2xx status — the same route the Monitoring Guild's uptime
  monitor already polls, so no separate alert path is needed. An app
  that's up but can't reach its database is not healthy.
> Enforcement: automated (custom) — the scaffold script that generates
> `/api/health` (Monitoring Guild) adds the DB check whenever a Prisma
> schema is present. Its test coverage (both the reachable and
> unreachable case, using a test double for the DB client) is required
> the same way as any other route under the Testing/QA Guild.

### Connection string as a secret
- The database connection string (`DATABASE_URL`) follows the exact same
  rule as any other secret: never hardcoded, never committed, present
  only as an environment variable scoped per environment (Production /
  Preview / Development) in Vercel, per the Security Guild's secrets
  rule and the Ops/Infra Guild's environment-variable rule.
- When Vercel Postgres/Neon is linked to the project, the connection
  string is auto-populated by the integration — that is the expected
  path, not a manual copy-paste into the dashboard.
> Enforcement: automated — `gitleaks` (Security Guild) already catches a
> hardcoded connection string as a leaked secret; no new tooling needed.

## Out of scope
This Guild deliberately does not yet cover:
- **Data warehousing / analytics pipelines** (dbt, ETL) — no Quest has
  needed one yet.
- **Multi-region replication** — not needed at the current scale.
- **A second supported database type** — Postgres is the only default;
  anything else is a per-Quest justified exception, not a second
  Guild-blessed standard.
- **Compliance-driven retention or deletion workflows** (GDPR-style
  "right to be forgotten," audit logging) — personal-project scope for
  now; revisit if a Quest actually needs it.
- **Seed data / local fixtures strategy** — not yet defined.

This is a conscious minimum-scope decision for the current stage of the
project, not an oversight — these are candidates for a future revision of
this Guild once real Quests surface a concrete need, not something to
re-propose from scratch via `guild-proposals.md`.

## Enforcement maturity
The point-in-time-recovery check in "Backup and retention" was the
obvious first candidate here — a single, mechanical flag readable from
the provider's API, not a matter of interpretation — so it was
implemented directly as `automated (custom)` above rather than left as a
future candidate. Of the rules still `agent-reviewed`, "Default database"
is the next most likely to partially mature: whether a stated alternative
to Postgres is *justified* will stay a judgment call, but whether the
Quest Brief contains a stated reason at all (versus silence) is a
mechanical presence check that could be scripted before the judgment
itself ever automates. The expand/contract schema compatibility rule, by
contrast, is a poor maturity candidate: it depends on reading what a
specific migration actually changes, which stays a real judgment call.

## Proposal log
See the master spec, section 6.
