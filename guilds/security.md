# Security Guild

> Applies to: all Quests
> Status: active

## Rules

### Secrets
No `.env` file (or any file matching `.env*`) may be committed. It must be
present in `.gitignore` from the initial scaffold.
> Enforcement: automated — gitleaks (or equivalent) as a CI job.

### Input validation
All user input must be validated before use — never trust that a received
value is well-formed (correct type, finite number, expected shape).
> Enforcement: agent-reviewed, spot-checked by unit tests in `/lib`.

### Dependencies
No dependency should be added without clear necessity. Every new dependency
must be justifiable in one sentence during scaffold or implementation.
> Enforcement: automated — `npm audit` (or equivalent) as a CI job, checking
> for known vulnerabilities. The "necessity" judgment itself stays
> agent-reviewed.

## Proposal log
See the master spec, section 6.
