# 3. Dual-target morph for reversible scroll

- Status: Accepted (implementation in M3)
- Context date: Milestone 3 planning

## Context

M3 drives morphing from scroll position. A visitor can scroll _backward_ and can rest _between_
two shapes. The M1/M2 engine is single-target: it interpolates from current positions to one
target, and swapping targets re-baselines "start = current". That silently assumes the swap
happens at full progress (`morphT = 1`). Under scrubbing that assumption breaks — crossing a
scene boundary while partway between shapes re-baselines from the wrong positions, and the cloud
snaps.

## Decision

Give `ParticleSystem` **two** target sets, A and B, and a `uBlend` uniform. A `ScrollDirector`
sets A = scene _i_, B = scene _i+1_, and `uBlend` = the fractional scroll within `[i, i+1]`.
Buffer swaps occur **only at integer scene boundaries** — the instant particles sit exactly on
a scene.

## Rationale

Blending between two fixed endpoints by a scroll-derived scalar is pure and stateless: the same
scroll position always yields the same particle positions, so scrubbing up and down retraces the
identical path with no snapping in either direction. Swapping only at boundaries means the swap
happens at the one moment where the outgoing and incoming targets agree on every particle's
position, so it is invisible.

This was chosen over alternatives: continuously re-baselining a single target (the snapping bug
above) and keeping a stack of N live targets (more memory and bookkeeping for no benefit over
two). Two targets is the minimum that makes scroll reversible, and it _subsumes_ the existing
random→face assemble (A = random, B = face, `uBlend` time-driven) instead of adding a parallel
code path — so it unifies behavior rather than expanding surface area.

This is the first core extension since M1 justified by a real new requirement (reversible
scroll) rather than anticipated complexity. It satisfies the project's bar: solves a real
problem, has multiple concrete uses, generalises existing behavior, adds no framework.

## Consequences

- Scroll-driven morphing is perfectly reversible by construction.
- Memory cost: a second target set (positions, and colors if scenes differ) — a few MB at
  Ultra. Trivial.
- The shader gains one blend; `MorphEngine`/`ScrollDirector` own the scene index and fractional
  blend. No buffer resize, honoring ADR-0002.
- The random→face intro and scene-to-scene morphs share one mechanism.
