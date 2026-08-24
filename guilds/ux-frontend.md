# UX/Frontend Guild

> Applies to: `web-app` Quests — any Quest with a visual interface a user
> interacts with directly.
> Not applicable to: `api`, `cli`, and `script` Quests — none of these
> render a UI, so there is nothing for a token scale or an accessibility
> rule to apply to. Matches this Guild's `appliesTo: ["web-app"]` entry in
> `guilds/manifest.json`.
> Status: active

## Purpose
Defines the objective, checkable baseline a Quest's UI must meet: a
design-tokens file that replaces loose hardcoded values, and a WCAG
accessibility baseline that is mostly machine-checkable. Per the master
spec's own framing (section 10), this is the conditional Guild with the
most automation potential — most of what "good UI" would otherwise be a
vague, agent-reviewed judgment call is instead reduced here to a value
either sourced from a token file or not, and a WCAG check either passing
or not.

This Guild deliberately does **not** define a design system or reusable
component library — that decision was made in the master spec (section
11) and is restated, not reopened, in "Out of scope" below. It closes two
forward references other Guilds left pointing here:
- The Architecture Guild's own "Out of scope" deferred "UI component/
  design system standard" to this Guild once active. This Guild's answer
  is the conscious decision above, not a new standard — Architecture's
  boundary (it stops at the Client/Server Component split, not visual
  component structure) still holds.
- The Product/Ideation Guild's own "Out of scope" deferred "UI/wireframe
  or visual requirements in the Brief" here. "Visual requirements in the
  Quest Brief" below is the concrete rule that closes it: this Guild
  supplies the objective baseline a Brief's acceptance criteria can point
  at, the same way an acceptance criterion can already point at the
  Security Guild's input-validation rule instead of restating it.

This Guild does not restate what other Guilds already own: the Code Style
Guild's component-naming and file conventions apply unchanged to any
`.tsx` file this Guild's rules also touch; the Testing/QA Guild's UI-layer
testing rule (Testing Library, one test per stateful/interactive
component) is where this Guild's accessibility assertions get added, not
a separate test layer.

Consulted by the Builder agent during implementation (development flow
steps 5-6) for token conformance and the accessibility baseline, and by
the QA agent when generating UI tests (step 7) for the accessibility
assertions this Guild requires inside those same test files.

## Rules

### Design tokens
Colors, spacing, and typography are objective values sourced from one
file, never loose literals scattered across components — this is what
makes "no hardcoded values" a mechanical check instead of a style
preference.
- **File**: `/styles/tokens.ts`, plain TypeScript — no React import, no
  styling-library dependency, so choosing one isn't implicitly forced by
  where the file lives. It exports three `as const` objects:
  - `colors` — at minimum a `background`, `surface`, `text`,
    `textMuted`, `border`, `primary`, `danger`, `success`, and `warning`
    role. Roles, not raw swatches — a component references `colors.text`,
    never a hex value directly.
  - `spacing` — a fixed numeric scale (e.g. `xs`/`sm`/`md`/`lg`/`xl`/
    `2xl`), used for margin, padding, and gap instead of an arbitrary
    pixel value chosen per component.
  - `typography` — a font-family stack and a type scale (e.g. `xs`
    through `2xl`) pairing a font size with a line height.
- This Guild standardizes the **shape** of `tokens.ts` and that it's the
  single source of truth — not the actual values inside it. What a
  Quest's palette or type scale actually *is* is a per-Quest visual-
  identity decision (see "Out of scope").
- No hardcoded color, spacing, or font value in `/app` or `/components` —
  a hex/`rgb()`/`hsl()` literal, a raw pixel/rem spacing value in an
  inline style or CSS file, or a font-family/font-size literal not
  sourced from `tokens.ts`.
> Enforcement: automated (custom) — a script (or a small custom ESLint
> rule) scans `/app` and `/components` for hardcoded color, spacing, and
> typography literals outside `tokens.ts`, the same regex-heuristic shape
> as the Code Style Guild's Portuguese-stopword scan and the Security
> Guild's `NEXT_PUBLIC_` name check. The file's required shape (the three
> exports and their minimum keys) is checked by a scaffold-time script;
> whether a chosen palette or scale is *good* is not this Guild's concern.

### Accessibility baseline (WCAG AA)
Automated checks, run via `eslint-plugin-jsx-a11y` (layered on top of the
Code Style Guild's `eslint-config-next`, which already bundles a basic
version of it — this Guild promotes the specific rules below from warn to
error via an ESLint override added at scaffold time) and `axe-core`
(asserted inside the same component test files the Testing/QA Guild's UI-
layer rule already requires, via `vitest-axe` or equivalent):
- **Color contrast** — 4.5:1 minimum for normal text, 3:1 for large text
  (18pt+, or 14pt+ bold) and UI components, checked against `tokens.ts`
  color pairs.
- **Alt text** — every image has meaningful `alt` text, or an explicit
  `alt=""` for a genuinely decorative one. Never omitted.
- **Semantic HTML** — interactive elements use their native tag
  (`<button>`, `<a href>`), not a `<div>` with a click handler; one `<h1>`
  per page, with no skipped heading levels.
- **Form labels** — every input has an associated `<label>` (explicit
  `htmlFor`/`id`) or `aria-label`/`aria-labelledby`. Never a placeholder
  alone.
- **ARIA roles** — no redundant, conflicting, or invalid role/attribute
  usage; required ARIA properties are present when a role needs them.
- **Lighthouse CI Accessibility score ≥ 90** — run against the PR's
  Vercel Preview deployment URL (Ops/Infra Guild's "Environment strategy"
  already provisions one per PR at no extra setup). This Guild owns the
  rule and the threshold; *where* the check runs in the pipeline is the
  Ops/Infra Guild's to define, the same ownership split the Architecture
  Guild's "Type checking" rule already established with that Guild — see
  that Guild's updated "CI/CD pipeline" for the added step.
- This Guild's stake in Lighthouse CI is the Accessibility category only.
  The Performance, Best Practices, and SEO categories it also reports are
  not gated on here (see "Out of scope").

Manual check, not automatable:
- **Screen-reader / keyboard-only spot check** — for any genuinely new
  interactive pattern shipped (a form, a modal, a custom dropdown — not a
  Quest's tenth button using an already-verified pattern), the Builder or
  Reviewer does one real pass with a screen reader (e.g. VoiceOver,
  Narrator) and keyboard-only navigation. Automated tooling above catches
  structural issues (a missing label, a bad role) but not whether the
  resulting experience actually makes sense read aloud or reached by tab
  order alone.
> Enforcement: automated — `eslint-plugin-jsx-a11y` overrides run as part
> of the existing Lint CI job (Code Style/Ops-Infra Guild); `axe-core`
> assertions run as part of the existing unit-test CI job (Testing/QA
> Guild); Lighthouse CI is a new job (Ops/Infra Guild pipeline). The
> screen-reader/keyboard spot check is agent-reviewed — judging whether a
> pattern is genuinely new, and whether the resulting experience is
> actually usable, isn't mechanical.

### Accessibility documentation (`accessibility.md`)
Every Quest gets a scaffolded `docs/accessibility.md`, the same way it
gets a `README.md` (Documentation Guild) and a `docs/quest-brief.md`
(Product/Ideation Guild) — a per-Quest artifact, not a guildhall file.
- Points at this Guild's WCAG baseline above rather than restating it —
  same discipline the README's "Quest Brief link" rule already uses to
  avoid a second copy that can drift.
- Logs the Lighthouse CI Accessibility score history (or a link to where
  CI records it) and every manual screen-reader/keyboard spot check
  performed: what pattern was tested, with what tool, and the outcome.
- Personal-project scale, matching the Documentation Guild's own
  incident-doc discipline: one markdown file, no ceremony beyond what
  future-you needs to trust the baseline was actually checked.
> Enforcement: automated (custom) — a scaffold script generates the file
> with these sections in place; a CI check can verify it still exists.
> Whether a spot-check log entry is genuinely present for a new
> interactive pattern is agent-reviewed.

### Visual requirements in the Quest Brief
Closes the Product/Ideation Guild's "UI/wireframe or visual requirements
in the Brief" item.
- A Quest Brief's acceptance criteria (Product/Ideation Guild format) may
  reference this Guild's rules directly instead of restating them — e.g.
  "the signup form meets the UX/Frontend Guild's contrast and label
  rules" rather than spelling out a contrast ratio in prose. This is the
  same cross-guild-reference pattern that Guild's own acceptance-criteria
  rule already demonstrates with the Security Guild's input-validation
  example.
- Anything beyond this Guild's objective baseline — a specific visual
  identity, a particular layout, "how it should feel" — is Quest-specific
  and belongs in the Brief's Scope section, not standardized here. This
  Guild draws the line between what must always hold (its own baseline)
  and what's particular to one Quest (the Brief); it does not itself
  produce wireframes or mockups, and no wireframing tool or format is
  chosen (see "Out of scope").
> Enforcement: agent-reviewed — the Product agent applies this split when
> drafting a Brief's acceptance criteria (development flow step 2); the
> Builder and Reviewer confirm the shipped UI actually meets the baseline
> during implementation and review (steps 5-6, 8).

## Out of scope

**Real gap, not a conscious decision:**
- **A concrete screen-reader testing protocol** — "Accessibility baseline"
  above names the spot check but not which tool/browser combination is
  standard or what a pass/fail bar looks like beyond "makes sense." No
  real Quest with a UI has been built under the full system yet (the MVP
  predates this Guild) to validate a concrete protocol against. Worth a
  `guild-proposals.md` entry once a web-app Quest actually exercises this
  check, not guessed at now.
- **A breakpoint/responsive token scale** — "Design tokens" defines
  color, spacing, and typography scales but no breakpoint scale, since no
  Quest has surfaced a concrete responsive-layout requirement to validate
  one against.

**Conscious minimum-scope decisions**, by contrast — deliberately not yet
covered:
- **Design system / reusable component library** — the decision the
  master spec (section 11) already made and this Guild's Purpose restates
  rather than reopens: start with tokens only. A component (Button,
  Input, Card…) is only worth extracting into a design system once it
  repeats consistently across 2-3 Quests with a UI — the same
  generalization test used to promote a `guild-proposals.md` entry into a
  Guild rule (spec section 6). Revisit once that repetition is real, not
  before.
- **Actual token values** (a specific palette, the exact numeric spacing/
  type scale) — this Guild standardizes `tokens.ts`'s shape and the
  enforcement mechanism against hardcoding, not the values themselves;
  each Quest's visual identity is its own decision, the same reasoning
  the Architecture Guild uses for not opinionating on a state-management
  library.
- **Dark mode / theming strategy** — no Quest has needed one yet.
- **A wireframing/mockup tool or format** (Figma or equivalent) — the
  Quest Brief captures acceptance criteria against this Guild's baseline
  (see "Visual requirements in the Quest Brief"), not a visual mockup;
  no tool is standardized.
- **Lighthouse's Performance, Best Practices, and SEO categories** — only
  the Accessibility category is this Guild's concern (see "Accessibility
  baseline"); a performance budget is not opinionated here.

These are candidates for a future revision of this Guild once real Quests
surface a concrete need, not something to re-propose from scratch via
`guild-proposals.md` — the same generalization discipline the
Architecture, Security, and Data Guilds' own "Out of scope" sections
already apply to their deferred items.

## Enforcement maturity
The hardcoded-value scan in "Design tokens," the `jsx-a11y` rule
promotion and Lighthouse CI threshold in "Accessibility baseline," and
the file-presence check in "Accessibility documentation" were all
implemented directly as `automated`/`automated (custom)` above rather
than left as future candidates — each is a mechanical, script-able check,
the same reasoning the Data Guild applied to its point-in-time-recovery
flag and the AI/Agents Guild applied to its cross-guild forward-reference
scan. Of the rules that stay `agent-reviewed`, "Visual requirements in
the Quest Brief" has a partial near-term candidate: whether an acceptance
criterion *cites* this Guild by name (versus restating contrast/ARIA
requirements in prose) is a mechanical presence check, the same shape as
the Product/Ideation Guild's own vague-term lexicon scan for acceptance
criteria — well before the deeper judgment of whether the criterion draws
the baseline-versus-Quest-specific line correctly ever automates. The
screen-reader/keyboard spot check, by contrast, is a poor maturity
candidate: judging whether a resulting experience genuinely makes sense
to a screen-reader or keyboard-only user is exactly the kind of
real-usability judgment automated tooling structurally can't reach —
it stays a human/agent check by design, not by current tooling
limitation.

## Proposal log
See the master spec, section 6.
