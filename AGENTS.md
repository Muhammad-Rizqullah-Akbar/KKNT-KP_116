# KKPD-KP V1.5 — Codex Instructions

This repository is the V1.5 rebuild of the KKPD-KP platform.

Before modifying code, Codex MUST read:

1. RULES.md
2. ARCHITECTURE.md
3. ROADMAP.md

These documents are authoritative.

## Development principles

- Work incrementally.
- Do not perform big-bang rewrites.
- Preserve validated business logic.
- Do not modify the legacy Firebase project.
- Do not migrate legacy data unless explicitly instructed.
- Complete one roadmap phase before moving to the next.
- Run relevant validation after every significant change.

## Important

If implementation conflicts with the architecture or rules:

DO NOT silently choose an implementation.

Explain:
1. the conflict
2. affected files
3. proposed solution
4. potential impact

Wait for confirmation when the decision materially affects:
- database schema
- authorization
- scoring
- historical data
- public visibility
- API contracts