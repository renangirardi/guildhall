# Ops/Infra Guild

> Applies to: Quests with a deploy target (web-app, api)
> Not applicable to: CLI and script Quests — there is nothing to deploy;
> those Quests still get lint/test/build checks from the Code Style and
> Testing/QA Guilds directly, without a deploy pipeline around them.
> Status: active

## Purpose
Defines the CI/CD pipeline, deploy platform, environment strategy, and
secrets handling in production. This is where the CI jobs that the Code
Style Guild (lint, format, branch naming, commit format) and Testing/QA
Guild (tests, coverage) assume exist are actually specified — what runs,
in what order, on what trigger, and what it means for a job to block a
deploy. Consulted by the Builder agent during scaffold (development flow
step 5) and by the Ops agent at deploy time (step 10).

## Rules

### CI/CD pipeline
- CI runs on GitHub Actions (or equivalent), triggered on every push to a
  pull request and on every push to `main`.
- Jobs run in this order, failing fast on the cheapest checks first:
  1. Branch name check — the PR's source branch matches the Code Style
     Guild's `type/short-kebab-description` pattern.
  2. Commit message check — every commit in the PR matches the Code Style
     Guild's Conventional Commits pattern (`commitlint` or equivalent).
  3. Install dependencies (cached).
  4. Lint — `eslint` (Code Style Guild).
  5. Format check — `prettier --check` (Code Style Guild).
  6. Type check — `tsc --noEmit`. This Guild only defines *where* this
     check runs in the pipeline; the rule itself — that types must be
     checked, and how strictly (`strict: true` in `tsconfig.json`) — is
     owned by the Architecture Guild's "Type checking" rule, since type
     strictness is what makes that Guild's own layering guarantees
     enforceable at compile time rather than just a convention.
  7. Unit tests with coverage — `vitest --coverage` (Testing/QA Guild).
  8. Secret scan — `gitleaks` (Security Guild).
  9. Dependency audit — `npm audit` (Security Guild).
  10. Build — `next build` (or equivalent), verifying the production
      build actually succeeds.
- Steps 1-2 need no dependency install at all — they check git/PR
  metadata (the branch name, the commit messages), not the code itself —
  so they run first, ahead of even "Install dependencies." Steps 4-9 may
  run as parallel jobs once dependencies are installed, since none of
  them depend on each other; Build (10) only runs after all of them pass.
- **Where the Code Style Guild's branch-naming and commit-format checks
  actually run**: that Guild states their enforcement ambiguously by
  design — "a CI check (or pre-push hook)" for branch naming, "commit-msg
  hook or CI check" for commits — and leaves resolving that to whichever
  Guild owns the pipeline, the same way it leaves *where* lint and format
  run to this Guild rather than claiming a pipeline position itself.
  Resolution: both, the same split lint and format already use. A local
  `commit-msg` hook (`commitlint` via `husky`, installed at scaffold time)
  gives fast feedback on the developer's own machine, mirroring how
  ESLint/Prettier already run locally through editor integration before
  CI ever sees them. But the actual gate is the CI job above: a local
  hook can be skipped (`--no-verify`) or simply never installed on a
  fresh clone or CI runner, so nothing this Guild calls "blocking" can
  depend on a local hook alone.
> Enforcement: automated — the full sequence runs as CI jobs on every push
> and PR; a failure in any job fails the pipeline.

### Deploy platform
- Vercel is the standard deploy platform for web-app and api Quests
  (validated in the MVP), connected directly to the Quest's GitHub repo.
- Required configuration per Quest, done at scaffold time:
  - Framework preset set to Next.js (auto-detected in the default stack).
  - Production environment variables entered in the Vercel project
    dashboard (see "Environment variables and secrets in production").
  - Build command and output directory left at Next.js defaults unless
    the Quest Brief explicitly requires an override.
> Enforcement: automated (custom) — a scaffold-time script checks the
> Vercel project exists and is linked to the repo; the environment
> variable content itself is agent-reviewed.

### Environment variables and secrets in production
- The Security Guild bans committing any `.env*` file. In production,
  that same value never comes from a file — it is entered directly as an
  environment variable in the Vercel project dashboard (or via
  `vercel env add`), scoped to the correct environment (Production /
  Preview / Development).
- Every Quest keeps a committed `.env.example` listing variable *names*
  only (no real values) — the contract for what must be configured in
  Vercel. It must be updated in the same PR that introduces a new
  variable.
- If a secret is ever caught by the `gitleaks` CI job (or otherwise
  leaked), the fix is to rotate it in Vercel and redeploy — removing it
  from git history alone does not resolve the leak, since the exposed
  value is already compromised.
> Enforcement: automated (custom) for `.env.example` staying in sync
> (a script can diff its keys against `process.env` references in code);
> agent-reviewed for whether a given variable belongs in Production,
> Preview, or both.

### Environment strategy
- **Production** — the `main` branch deploys to the Quest's production
  URL on every merge.
- **Preview** — every pull request gets an automatic preview deployment
  via Vercel's GitHub integration, with its own URL, at no extra
  configuration. This is the artifact used for the pre-deploy Checkpoint
  (development flow step 9) — review the actual preview URL, not just the
  diff.
- There is no separate persistent staging environment — preview-per-PR
  already covers that need at this project's scale (see "Out of scope").
> Enforcement: automated — Vercel provisions preview deployments
> automatically per PR; no manual setup required.

### What blocks a deploy
- **Blocking — deploy safety** (must pass before merge to `main`, which
  is what triggers a production deploy; every item here describes
  whether the code that would actually ship is correct and safe):
  - Lint errors
  - Prettier check failures
  - Type errors (`tsc`)
  - Failing unit tests
  - `/lib` coverage below the Testing/QA Guild's 80% threshold
  - Any secret detected by `gitleaks`
  - Build failure
  - `npm audit` reporting a `high` or `critical` severity vulnerability
  - Migration failure (`prisma migrate deploy`) — defined by the Data
    Guild, which owns the migration job itself; listed here so this
    Guild's blocking list stays complete on its own
- **Blocking — PR hygiene** (required via the same branch-protection rule
  before merge, but kept in a separate tier on purpose):
  - Branch name not matching the Code Style Guild's pattern
  - A commit in the PR not matching Conventional Commits
  - **Why a separate tier, not folded into "deploy safety" above**:
    these two checks say nothing about the code that ends up in
    production — a PR with a perfectly safe, well-tested diff can fail
    only because of how the branch was named or a commit message was
    phrased. That distinction stops being academic the moment the PR
    merges: a deploy-safety failure would have meant something is now
    live and broken, while a hygiene failure means nothing about
    production at all — a branch name and a commit message don't outlive
    the merge in any way that touches the running app. They still gate
    merge, and on this pipeline merge and deploy are the same event, so
    mechanically they still block *this* deploy — but they're a
    process gate on how the change was made, not a judgment on whether
    the change itself is safe to run, which is why they're listed
    separately instead of alongside the checks that are.
- **Warning only** (surfaced, does not block):
  - `npm audit` findings below `high` severity
  - Coverage changes outside `/lib`, since no blanket threshold applies
    there (Testing/QA Guild)
- Enforced via GitHub branch protection on `main` requiring all blocking
  jobs — both tiers — to pass before merge is allowed. Preview
  deployments for a PR still build even while CI is red — the point of a
  preview is to let a human look at it — but that PR cannot merge until
  it's green.
> Enforcement: automated — branch protection rules on `main` require the
> blocking CI jobs listed above, both tiers.

### Rollback
- Vercel keeps every deployment immutable at its own URL. To roll back a
  bad production deploy, promote the last known-good deployment back to
  Production (Vercel dashboard "Promote to Production" or
  `vercel rollback`) — this takes effect immediately, without waiting on
  a new CI run.
- The Ops agent can detect the problem and recommend a rollback, but
  cannot execute it unilaterally: rolling back production is a
  developer-facing action that requires explicit confirmation before it
  runs, the same way the flow's Checkpoints (spec section 5, steps 4 and
  9) gate other production-impacting decisions. The agent proposes which
  deployment to promote and why; the developer confirms before it
  happens.
- A promoted rollback can silently reintroduce a dependency
  vulnerability that had already been patched after that older
  deployment — rolling back the code also rolls back its dependency
  versions. Immediately after promotion, re-run `npm audit` and
  `gitleaks` against the now-live (reverted) commit, not just the commit
  that was rolled back *from*.
- A rollback via promotion is a stopgap: a revert commit must still follow
  on `main` so the branch reflects what's actually live in production.
- Promoting old code does not revert the database schema. Whether that's
  safe is the Data Guild's guarantee, not this Guild's: its expand/
  contract migration rule exists specifically so a code rollback never
  lands on a schema it doesn't understand.
> Enforcement: agent-recommended, human-confirmed — the Ops agent
> detects the issue, identifies the target deployment, and proposes the
> rollback; a human must confirm before it executes. The post-rollback
> `npm audit`/`gitleaks` re-check is automated once the rollback is
> confirmed and executed.

## Out of scope
This Guild deliberately does not yet cover:
- **Infrastructure as code** (Terraform or equivalent) — Vercel's own
  dashboard/CLI configuration is the standard for now.
- **A persistent staging environment** — preview-per-PR fills that role
  at the current scale.
- **Multi-region deploys, CDN/caching strategy, blue-green or canary
  releases** — not a need any Quest has surfaced yet.
- **Alerting on production incidents** — owned by the Monitoring/
  Observability Guild; this Guild stops at "the deploy succeeded."

This is a conscious minimum-scope decision for the current stage of the
project, not an oversight — these are candidates for a future revision of
this Guild once real Quests surface a concrete need, not something to
re-propose from scratch via `guild-proposals.md`.

## Enforcement maturity
The most likely `agent-reviewed` candidate to mature into `automated`
(per the master spec, section 10) is the environment-variable placement
judgment in "Environment variables and secrets in production" — deciding
whether a given variable belongs in Production, Preview, or both. Most
Quests will draw that line the same mechanical way (e.g. anything named
or tagged as a test/sandbox key defaults to Preview-only, everything else
goes to both), which is exactly the kind of narrow, repeatable judgment
that matured into a script for the "component has a test file" check in
the Testing/QA Guild. The rollback confirmation gate, by contrast, is not
a maturity candidate — it stays a human checkpoint by design, not by
current tooling limitation.

## Proposal log
See the master spec, section 6.
