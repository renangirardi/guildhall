# Code Style Guild

> Applies to: all Quests
> Status: active

## Tooling
- ESLint (Next.js default config) + `eslint-config-prettier` to disable
  formatting rules that conflict with Prettier.
- Prettier for formatting, explicit config (do not rely on undocumented
  defaults):
  `{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 80 }`
> Enforcement: automated — `eslint` + `prettier --check` in CI.

## Naming conventions
- Components: PascalCase (`Calculator.tsx`)
- Functions and variables: camelCase
- One component per file
> Enforcement: automated — ESLint naming rules where available; the rest is
> agent-reviewed.

## Commits
Conventional Commits format (`feat: ...`, `fix: ...`, `chore: ...`, `test: ...`).
> Enforcement: automated (custom) — commit-msg hook or CI check against the
> Conventional Commits pattern.

## Language
- Every artifact in the repository must be written in English: code,
  variable/function names, comments, tests, commit messages, and
  documentation (README, Quest Brief, guild documents, ADRs).
- Runtime-facing content (error messages, UI text) must also be in English.
- Conversation with the developer (chat, decision discussions) may remain in
  the developer's preferred language — it is not a repository artifact.
> Enforcement: automated (custom) — a CI script scanning `.ts`/`.tsx`/`.md`
> files for non-ASCII / non-English patterns as a best-effort check; final
> judgment is agent-reviewed.

## No dead code
No commented-out code should be left in a commit — remove it or don't commit it.
> Enforcement: agent-reviewed.

## Proposal log
See the master spec, section 6.
