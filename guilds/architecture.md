# Architecture Guild

> Applies to: all Quests
> Status: active

## Purpose
Defines how a Quest is structured internally, independent of what the Quest
does. Consulted by the Architect agent before any scaffold or structural
decision.

## Rules

### Default stack
- Next.js (App Router) + TypeScript for web-app Quests.
- No separate backend unless the Quest Brief explicitly requires one — use
  API Routes for server-side logic first.
> Enforcement: agent-reviewed

### Folder structure (web-app)
- `/app` — routes and pages (App Router)
- `/components` — reusable UI components
- `/lib` — pure business logic (functions, calculations), no UI, no React
imports
> Enforcement: automated (custom) — a setup script checks these directories
> exist after scaffold.

### Separation of concerns
Business logic must live in `/lib`, never directly inside a UI component.
This exists to keep logic testable independent of rendering.
> Enforcement: automated (custom) — dependency-cruiser rule forbidding
> `/components` files from containing non-trivial computation (flagged for
> agent review, not a hard block yet).

### Client vs Server Components
Mark a component `"use client"` only where interactivity (state, event
handlers) is required. Everything else defaults to Server Component.
> Enforcement: agent-reviewed

## Proposal log
Proposals affecting this Guild are tracked per-Quest in `guild-proposals.md`
and reviewed via the `review-proposals` CLI command. See the master spec,
section 6.
