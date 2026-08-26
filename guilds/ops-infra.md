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
  11. Accessibility audit (web-app Quests only) — Lighthouse CI against
      the PR's Vercel Preview deployment URL (see "Environment
      strategy"), failing if the Accessibility category score drops
      below the UX/Frontend Guild's threshold. This Guild only defines
      *where* this check runs and that it's blocking; the rule itself —
      the threshold, and that only the Accessibility category is gated
      on — is owned by the UX/Frontend Guild's "Accessibility baseline
      (WCAG AA)" rule, the same ownership split the Architecture Guild's
      "Type checking" rule already established with this Guild.
- Step 11 differs from 1-10 in one way worth naming: it depends on the
  Vercel Preview deployment actually existing first, since Lighthouse
  audits a live URL rather than the code directly — so it runs after the
  Preview deployment completes, not in parallel with the dependency-
  installed jobs above. It does not apply to `api` Quests within this
  Guild's own applicability (there is no page for Lighthouse to audit).
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
  - Framework preset pinned explicitly via a committed `vercel.json` —
    see "Framework Preset: vercel.json and step-10 verification" below
    for why this isn't left to Vercel's auto-detection.
  - Production environment variables entered in the Vercel project
    dashboard (see "Environment variables and secrets in production").
  - Build command and output directory left at Next.js defaults unless
    the Quest Brief explicitly requires an override.
> Enforcement: automated (custom) — a scaffold-time script checks the
> Vercel project exists and is linked to the repo; the environment
> variable content itself is agent-reviewed.

### Framework Preset: vercel.json and step-10 verification
Vercel auto-detects a project's Framework Preset from whatever code sits
on `main` at the moment the Vercel project is first connected to the
repo. If that connection happens before any real Next.js code exists —
a Vercel project linked ahead of the Quest's first real commit, against
an empty or pre-scaffold `main` — it auto-detects "no framework" and
pins the preset to `Other`. That state does not self-correct once real
code lands, and nothing in "CI/CD pipeline" or "What blocks a deploy"
below is positioned to catch it: lint, type-check, tests, and
`next build` all still pass, since none of them talk to Vercel's
platform configuration. The project builds green through every CI job
and still fails at Vercel's own deploy step, with "No Output Directory
named 'public' found" — a platform-configuration failure, not a
code-quality one. Evidence: calculator-quest, step 10 (Quartermaster).
- **Fix, going forward** — the scaffold (development flow steps 5-6)
  includes a committed `vercel.json` at the Quest root with
  `{"framework": "nextjs"}` by default. This makes the Framework Preset
  explicit in version control instead of inferred from auto-detection
  timing, so it no longer matters whether the Vercel project was
  connected before or after real application code exists.
  > Enforcement: automated (custom) — a scaffold-time script checks
  > `vercel.json` exists with `"framework": "nextjs"` at the Quest root.
- **Check, for what the fix above can't retroactively cover** —
  `vercel.json` only protects a Quest scaffolded after this rule
  existed; it does nothing for a Vercel project that was already
  connected and mis-detected earlier, or one where the preset was
  changed by hand in the dashboard after connection. The Ops agent
  (Quartermaster) closes that gap: the first time development flow
  step 10 runs against a Quest that already has real application code in
  `main` — not merely that the Vercel project exists and is linked,
  which "Deploy platform"'s enforcement above already checks —
  Quartermaster runs `vercel project inspect <name>` (read-only; it does
  not modify the project) and confirms the reported Framework Preset is
  `Next.js`. A mismatch is reported to the developer before the deploy
  proceeds, instead of surfacing only when the deploy itself fails. This
  is a one-time check per Quest, not something to repeat on every later
  step-10 run — once confirmed (or corrected), `vercel.json` keeps it
  pinned for every deploy after.
  > Enforcement: agent-reviewed — a read-only inspection an agent
  > performs and reports on, not a CI script; Vercel exposes no
  > pre-deploy hook for this today.

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
  - Lighthouse CI Accessibility score below threshold (web-app Quests
    only) — defined by the UX/Frontend Guild, which owns the threshold
    itself; listed here for the same reason as the migration item above
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

**Real gap, not a conscious decision:** none — every item previously
listed in this section carries an explicit reason tied to this project's
current scale or an already-chosen substitute, not silence born of never
having gotten there (see below).

**Conscious minimum-scope decisions:**
- **Infrastructure as code** (Terraform or equivalent) — Vercel's own
  dashboard/CLI configuration is the standard for now.
- **A persistent staging environment** — preview-per-PR fills that role
  at the current scale, per "Environment strategy" above, which already
  states this directly as a Rule rather than leaving it only as a
  deferral here.
- **Multi-region deploys, CDN/caching strategy, blue-green or canary
  releases** — not a need any Quest has surfaced yet.
- **Alerting on production incidents** — owned by the Monitoring/
  Observability Guild; this Guild stops at "the deploy succeeded." Unlike
  the three items above, this one is a permanent ownership boundary, not
  a temporary deferral — it isn't expected to ever move back into this
  Guild's scope.

The first three are candidates for a future revision of this Guild once
real Quests surface a concrete need, not something to re-propose from
scratch via `guild-proposals.md`. The fourth already has a home — the
Monitoring/Observability Guild — so there's nothing left to revisit here.

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

## Changelog
- **0.1.5** (2026-08-25) — Added "Framework Preset: vercel.json and
  step-10 verification": the scaffold now includes a committed
  `vercel.json` (`{"framework": "nextjs"}`) by default so the Framework
  Preset no longer depends on Vercel's auto-detection timing relative to
  when real Next.js code lands in `main`, and the Ops agent
  (Quartermaster) now runs a read-only `vercel project inspect <name>`
  the first time step 10 runs against a Quest with real application
  code already present, to catch a project mis-detected before this fix
  existed. Evidence: calculator-quest, step 10 (Quartermaster). Tracked
  under the shared `guilds/manifest.json` version — see the root
  `CHANGELOG.md` and the README's "Adding or editing a guild" section for
  the versioning convention.
