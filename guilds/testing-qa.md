# Testing/QA Guild

> Applies to: all Quests
> Status: active

## Purpose
Defines how a Quest is tested: framework, file organization, minimum
coverage, and what counts as a good enough test. Consulted by the QA agent
when generating tests (development flow step 7) and by the Reviewer agent
during code review (step 8), ahead of the pre-deploy Checkpoint (step 9).

## Rules

### Default framework
- Vitest is the standard test runner and assertion library for all Quests.
- For Quests with a UI layer, add `@testing-library/react` and
  `@testing-library/user-event` for component tests — no other component
  testing library is used unless the Quest Brief states a specific reason.
> Enforcement: automated (custom) — a setup script checks `vitest` (and
> `@testing-library/react` for web-app Quests) are present in
> `package.json` after scaffold.

### File organization
- Test files are co-located with the source file they test, using the
  `.test.ts` / `.test.tsx` suffix (e.g. `calculate.ts` →
  `calculate.test.ts`, in the same directory).
- No separate top-level `/tests` or `__tests__` mirror tree — co-location
  keeps a test next to the code it exercises and makes an untested file
  visually obvious.
> Enforcement: automated (custom) — a script checks that every non-trivial
> file under `/lib` has a matching `.test.ts` file in the same directory.

### Minimum coverage
- `/lib` (pure business logic) must maintain at least **80% line
  coverage**, enforced via Vitest's coverage thresholds
  (`coverage.thresholds.lines` scoped to `/lib`).
- No blanket line-coverage number is imposed on the UI layer (see "Test
  types by layer" below) — coverage percentage is a poor proxy for
  rendering-heavy code and pushes toward low-value tests (snapshots,
  trivial render checks) just to hit a number.
- **Why 80% and only for `/lib`:** logic in `/lib` is pure (per the
  Architecture Guild's separation of concerns), deterministic, and cheap
  to test — no rendering, no I/O, no mocking of the unit under test. There
  is little excuse for it to be undertested. 100% is not required because
  it tends to reward testing trivial branches (e.g. simple getters) at the
  same cost as testing the branches that actually carry risk.
> Enforcement: automated — `vitest --coverage` as a CI job, failing the
> build if `/lib` drops below threshold.

### Test types by layer
- **`/lib` (all Quest types)** — pure unit tests. Mock only true external
  boundaries (network calls, filesystem, system clock, randomness passed
  in as a dependency) — never mock the function or module under test
  itself.
- **UI layer (web-app Quests, `/components` and `/app`)** — behavior-
  focused tests via Testing Library: render the component, interact with
  it the way a user would (`user-event`), and assert on visible output.
  Every component with conditional rendering or an interactive element
  needs at least one test; components that are pure presentation
  (static markup, no branches, no handlers) do not require a dedicated
  test file.
- **API/route layer (`api` Quests, or `web-app` Quests with API routes)**
  — integration tests that call the handler directly with representative
  valid and invalid payloads, asserting on status code and response shape.
- **CLI Quests** — tests that invoke the command and assert on stdout/
  stderr and exit code, for both success and failure paths.

Whether a test *exists* and whether that test is *good* are checked
separately:
- **Existence** — every component under `/components` with state or an
  event handler must have a matching `.test.tsx` file, same principle as
  the `/lib` check above.
  > Enforcement: automated (custom) — a script checks that every
  > `/components` file using `useState`/`useReducer` or an `on*` handler
  > prop has a matching `.test.tsx` file in the same directory.
- **Quality** — whether a given test actually covers the right scenarios,
  tests behavior rather than implementation, and follows the layer
  guidance above.
  > Enforcement: agent-reviewed — the QA agent applies this per file when
  > generating tests; the Reviewer agent checks for gaps during code
  > review (step 8).

### Error and edge cases are required, not optional
Every test suite for a function, component, or handler must include at
least one case beyond the happy path — invalid input, empty/boundary
values, or a failure branch — not only the case where everything goes
right. This is the testing-side enforcement of the Security Guild's input
validation rule: if input must be validated, there must be a test proving
the validation actually rejects bad input.
> Enforcement: agent-reviewed — checked by the QA agent at test-generation
> time and by the Reviewer agent during code review (step 8).

### What makes a test good enough
A test is good enough when it satisfies all of the following:
- **Tests behavior, not implementation** — asserts on inputs/outputs or
  visible behavior, never on private internals or implementation details
  that could change without changing behavior.
- **Deterministic** — passes identically on every run; no dependency on
  real time, real randomness, or network/filesystem state that isn't
  explicitly set up by the test itself.
- **One scenario per test**, with a test name that states the scenario
  (e.g. `"throws when amount is negative"`, not `"works"`).
- **Fails with a diagnostic message** — reading the failure output should
  say what broke without needing to open the source file.
> Enforcement: agent-reviewed.

## Out of scope

**Real gap, not a conscious decision:**
- **Integration/e2e tests** — full user-flow testing across the whole
  Quest (e.g. Playwright/Cypress). "Test types by layer" above defines a
  strategy per layer (`/lib`, UI, API/route, CLI) but never addresses a
  flow spanning several of them together, and nothing here explains why
  — it simply hasn't been decided yet.
- **Flaky test policy** — what to do with a test that fails
  non-deterministically (quarantine, retry, delete). No stated reason
  this was left out, unlike e.g. the Ops/Infra Guild's scale-contingent
  deferrals — it's undefined because no Quest has hit this yet, not
  because the question was deliberately deferred.
- **Test suite runtime expectations** — how long the suite is allowed to
  take before it's considered a problem. Same as above: silent, not
  ruled out on purpose.

None of these three carry a stated reason for being left out the way,
for example, the Security Guild's CORS or rate-limiting deferrals do —
they're silent because no Quest has been built at the scale or maturity
to surface them, not because this Guild weighed them and chose to wait.
Worth a `guild-proposals.md` entry once a real Quest actually needs one
of these, rather than guessed at now with nothing to validate against.

**Conscious minimum-scope decisions:** none — every item previously
listed in this section turned out, on review, to be a real gap rather
than a deliberately narrowed decision with a stated justification (see
above).

## Enforcement maturity
Among the `agent-reviewed` rules above, the ones built from narrow,
mechanical judgments are the most likely to mature into `automated` first
(per the master spec, section 10). The "every stateful/interactive
component has a test file" check in "Test types by layer" already made
that jump — it started as a judgment call and is now a scripted
`automated (custom)` check. Applying the same pattern, the "at least one
error/edge-case test per unit" rule is the next-best candidate: presence
of such a test could plausibly be approximated by a script (e.g. a test
title containing "invalid"/"throws"/"error") before the broader "is this
test actually good" judgment — which depends on reading intent behind the
test, not just detecting its existence — ever does.

## Proposal log
See the master spec, section 6.
