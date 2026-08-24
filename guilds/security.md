# Security Guild

> Applies to: all Quests
> Status: active

## Purpose
Defines the security-hygiene baseline every Quest must meet regardless of
what it does: how secrets are handled end to end, how user input is
treated as untrusted until proven otherwise, and how a new dependency
earns its place before it's pulled into the build. Every core Guild
written so far already assumes some part of this Guild holds, rather than
restating it:
- The Ops/Infra Guild's CI pipeline runs `gitleaks` and `npm audit` as the
  concrete tools this Guild names below, and its "what blocks a deploy"
  list inherits the severity threshold this Guild's "Dependencies" rule
  defines — the same ownership split the Architecture Guild's "Type
  checking" uses with the Ops/Infra pipeline: this Guild owns the rule and
  its threshold, Ops/Infra owns *where* the check runs and what it blocks.
- The Ops/Infra Guild's environment-variable strategy — `.env.example` as
  the committed contract, real values entered only in the Vercel
  dashboard, rotate-and-redeploy on a leak — is the production-specific
  instance of this Guild's secrets rule, not a separate rule of its own.
- The Monitoring Guild's "never log a secret" rule is an explicit
  extension of this Guild's secrets rule into a channel — application
  logs — that git-focused enforcement (`gitleaks`) can't see.
- The Data Guild's "connection string as a secret" rule and the AI/Agents
  Guild's dependency-justification authority for the Builder agent both
  point back to this Guild's rules rather than defining their own version.
- The Testing/QA Guild's "error and edge cases are required" rule is the
  test-side enforcement of this Guild's input-validation rule below — a
  validation rule with no test proving it actually rejects bad input isn't
  really enforced, just stated.

Consulted by the Builder agent during scaffold and implementation
(development flow steps 5-6) and by the Reviewer agent as part of its
security checklist during code review (step 8), per the AI/Agents Guild's
role definitions.

## Rules

### Secrets
A secret — an API key, a database connection string, a signing key, a
third-party credential, anything that grants access to something — must
never be exposed through any channel, not only git. That includes a
committed `.env*` file, a value hardcoded directly in source (even outside
`.env`), an application log line (Monitoring Guild's extension of this
rule), an error message or stack trace returned to a client, and a
client-side JavaScript bundle.

- No `.env` file (or any file matching `.env*`) may be committed. It must
  be present in `.gitignore` from the initial scaffold.
- A secret is never hardcoded in source either, even as a "temporary"
  placeholder — `gitleaks` catches many committed-file patterns, but the
  rule is "never expose the value," not "don't get caught by this
  particular tool."
- In the default Next.js stack, an environment variable prefixed
  `NEXT_PUBLIC_` is bundled into client-side JavaScript and readable by
  anyone who opens the page — never put a real secret behind that prefix.
  If a value must be public (a public API base URL, a feature flag), the
  prefix is correct; if it grants access to anything, it isn't.
- The committed contract for what environment variables a Quest needs is
  `.env.example` (names only, no real values) — owned in full by the
  Ops/Infra Guild's environment-variable strategy. This Guild's stake in
  it is only the underlying rule `.env.example` exists to protect: never
  commit or hardcode a real value.
- If a secret leaks anyway — caught by `gitleaks`, or discovered after the
  fact — the fix is to rotate the credential at its source. Removing the
  value from git history does not un-expose it; whoever saw it still has
  it. The Ops/Infra Guild's "rotate in Vercel and redeploy" flow is this
  general rule applied to the specific case of a Vercel-hosted secret.
- This applies uniformly regardless of what the secret is *for* — a
  third-party API key, a database connection string (Data Guild), or a
  monitoring-tool credential (Monitoring Guild) all follow this same rule.
  There is no implicit carve-out for a particular tool or vendor just
  because it isn't the Quest's own stack.
> Enforcement: automated — `gitleaks` (or equivalent) as a CI job,
> catching committed secrets and hardcoded patterns in tracked files. The
> `NEXT_PUBLIC_` naming check is a narrower automated (custom) candidate
> (see "Enforcement maturity") rather than a hard block today, since a
> name-based heuristic can false-positive on a legitimately public value
> named similarly to a secret.

### Input validation
All user input must be validated before use — never trust that a received
value is well-formed (correct type, finite number, expected shape, within
any range the code assumes) just because it arrived. "User input" means
anything crossing a trust boundary: an API route body or query string, a
form submission, a CLI argument, not only literal keyboard input.

- **Default validation library**: Zod is the standard for schema
  validation at any boundary — API route input, form input before
  submission, CLI argument parsing. One library across a Quest, not
  several competing ones, the same reasoning the Testing/QA Guild uses
  for picking a single component-testing library.
- **SQL/NoSQL injection**: Prisma (the Data Guild's default ORM)
  parameterizes queries by default, which is most of this rule's
  enforcement in practice. Building a query by concatenating user input
  into a raw string (`$queryRawUnsafe` or equivalent) is avoided by
  default; if a Quest genuinely needs it, it carries the same
  one-sentence-justification bar this Guild's "Dependencies" rule uses
  for a new package — an exception this deliberate should be at least as
  visible as adding a library.
- **XSS**: React/Next.js auto-escapes rendered output by default, which is
  why this Guild doesn't need a general HTML-escaping rule. The one place
  that default is opted out of is `dangerouslySetInnerHTML` (or an
  equivalent raw-HTML injection) — avoided by default, and any exception
  must sanitize the content first (e.g. DOMPurify) and carry the same
  one-sentence justification as a raw SQL query above.
- **Command injection**: a Quest that shells out to a system command must
  not build the command string by concatenating user input into it — use
  an argument-array API (e.g. Node's `execFile` with an `args` array)
  instead of a string-interpolated `exec` call, so the shell never
  re-parses attacker-controlled text.
- **Why these three and not a longer OWASP-style checklist**: these are
  the injection classes the default stack (Next.js, Prisma, Node) can
  actually produce given how a Quest is built per the Architecture and
  Data Guilds. A checklist item for a vulnerability class the stack
  structurally can't reach (e.g. classic server-side template injection
  in a stack with no server-side templating) would be dead weight, not
  rigor.
> Enforcement: agent-reviewed, spot-checked by unit tests in `/lib` (the
> Testing/QA Guild's error/edge-case requirement is exactly this check).
> The SQL/XSS defaults above are a good automated (custom) candidate — see
> "Enforcement maturity."

### Dependencies
No dependency should be added without clear necessity. Every new
dependency must be justifiable in one sentence during scaffold or
implementation.
- **Why one sentence, not a formal review**: the bar is deliberately low
  effort but non-zero — enough friction that "I'll just add a library for
  this" gets a moment of thought, not so much that it becomes a process
  nobody follows. This is the same justification the AI/Agents Guild
  points to when defining the Builder agent's authority boundary: adding
  a dependency without that sentence is explicitly called out as outside
  what the Builder can decide alone.
- **Severity threshold**: `npm audit` (or equivalent) runs as a CI job
  checking installed dependencies for known vulnerabilities. A `high` or
  `critical` finding blocks the build; anything below `high` is surfaced
  as a warning but does not block. This threshold is what the Ops/Infra
  Guild's "what blocks a deploy" list already encodes — this Guild is
  naming the rule Ops/Infra's list assumed, not introducing a new one.
- **Keeping dependencies current**: justification at add-time answers
  "should this exist in the Quest at all," not "is it still up to date
  six months later" — a separate concern this Guild's original version
  didn't cover. Dependabot (GitHub's native tooling, no added cost or
  account) is enabled at scaffold time to open automated PRs for outdated
  or newly-vulnerable dependencies. A routine version-bump PR is
  maintenance, not a new dependency decision, and doesn't need a fresh
  one-sentence justification; it goes through the same CI pipeline and
  Reviewer checklist as any other change, no special-casing. A dependency
  that `npm audit` flags at `high`/`critical` is already forced current by
  the blocking threshold above — Dependabot's role is catching the
  quieter case of a dependency that's simply stale, before it becomes a
  vulnerability.
> Enforcement: automated — `npm audit` (or equivalent) as a CI job with
> the `high`/`critical`-blocks threshold above; the "necessity" judgment
> for a *new* dependency stays agent-reviewed. Dependabot's PR cadence is
> automated (custom) — a scaffold-time config file, not a judgment call.

## Out of scope

**Real gap, not a conscious decision:**
- **Authentication and authorization** — no Guild, including this one,
  defines a standard session strategy, identity provider, or
  password-handling approach. The MVP (master spec, section 9) didn't
  need auth, but that was a property of *that* Quest Brief — a
  Quest-specific decision, not a general rule this Guild deliberately
  scoped out. There's no validated default the way Next.js/Vercel/Prisma
  became defaults after the MVP proved them out (master spec, section 3:
  a Guild rule "is born from real repetition," not invented ahead of
  evidence). Worth a `guild-proposals.md` entry once a real Quest
  actually needs auth and a pattern can be validated against it, rather
  than guessed at here with nothing to test it against.

**Conscious minimum-scope decisions**, by contrast — deliberately not yet
covered:
- **CORS** — the Architecture Guild's default (no separate backend
  service unless justified; Next.js API Routes only) means frontend and
  API share an origin by default. CORS only becomes a real question once
  a Quest exposes an API a separate origin needs to call (a mobile
  client, a third-party integration), and no Quest has needed that yet.
- **Rate limiting** — relevant once a Quest exposes a public-facing API
  absorbing arbitrary traffic; no Quest has been at that scale or had
  that exposure so far.
- **Security headers / CSP** — Next.js's own defaults are reasonably safe
  out of the box at this project's current scale; a dedicated headers
  policy is deferred until a Quest's threat model actually calls for one.
- **Authorization models** (RBAC, multi-tenant data isolation) — moot
  until authentication itself has a standard (see the real gap above);
  defining authorization ahead of authentication would be building on
  nothing.

These are candidates for a future revision of this Guild once a real
Quest surfaces a concrete need, not something to guess at now — the same
generalization discipline the Architecture Guild's own "Out of scope"
section applies to its deferred items.

## Enforcement maturity
The `npm audit` severity threshold is already `automated` and not a
maturity candidate — it's a mechanical pass/fail on a number. Of the
`agent-reviewed` rules, the SQL/XSS injection defaults in "Input
validation" are the most likely near-term candidate: detecting *usage
sites* of `$queryRawUnsafe`/raw SQL string-building or
`dangerouslySetInnerHTML` is a narrow, mechanical grep-style check a
script can flag for mandatory review — the same shape as the "component
has a test file" check that already matured in the Testing/QA Guild —
well before the deeper judgment of "was this input actually validated
correctly" ever automates. The `NEXT_PUBLIC_` secret-name heuristic in
"Secrets" is a similar candidate, though a weaker one: it's mechanical to
script, but a name-based heuristic (does `NEXT_PUBLIC_STRIPE_KEY` sound
like a secret?) will always need a human to resolve edge cases, so it's
likely to stay a flag-for-review check rather than a hard CI block even
once implemented. The one-sentence "necessity" judgment for a new
dependency, by contrast, is a poor maturity candidate — whether a
justification is *actually* sound, not just present, depends on reading
intent the same way the Architecture Guild's "stated deviation is
actually justified" judgment does.

## Proposal log
See the master spec, section 6.
