# Contributing

Thanks for your interest. This is an early, single-maintainer engine built milestone by
milestone, so the most useful thing a contributor can do is understand the existing design
before changing it.

## Start here

1. Read [`docs/architecture.md`](docs/architecture.md) and skim the
   [ADRs](docs/adr). The "why" matters more than the "what" in this repo.
2. Run it: `npm install && npm run dev`.

## The one principle

> Abstractions are extracted from real instances, not guessed up front.

Concretely: a new framework, registry, event bus, or generic layer needs at least a second or
third real consumer to justify it. "We might need it later" is a reason to write it down in an
ADR, not to build it now. Several deliberate _non_-additions are documented in the ADRs — please
read those before proposing infrastructure.

## Before opening a PR

All four must pass:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
```

(`npm run format` fixes formatting; `npm run lint:fix` fixes auto-fixable lint.)

## Style and scope

- TypeScript strict mode; no `any`. Let types document intent.
- One responsibility per module; a doc comment at the top saying what it owns.
- Keep per-frame work allocation-free and off the particle buffer where possible.
- Match the milestone discipline: small, reviewable changes that close cleanly. If a change
  introduces an architectural decision, add an ADR for it.
