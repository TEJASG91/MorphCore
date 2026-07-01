# 2. Fixed particle budget (`N` chosen once at startup)

- Status: Accepted
- Context date: Milestone 1

## Context

The engine renders `N` particles and morphs them between shapes. `N` could be chosen per device
for performance, and one might want to change it at runtime (e.g. a quality slider). We had to
decide whether the buffer size is fixed or dynamic.

## Decision

Choose `N` **once** at startup from a quality tier (`QualityTiers`, overridable via
`?quality=`), and never change it during the session. Changing tier requires a reload.

## Rationale

Morphing interpolates particle _i_ in shape A to particle _i_ in shape B. That requires a stable
one-to-one correspondence across the whole buffer. If `N` changes mid-session, the
correspondence is destroyed: particles would have to be added or removed mid-flight, and there
is no correct position for them to be at during a morph. Every target provider also bakes
exactly `N` positions; a runtime resize would invalidate all loaded and cached targets at once.

A fixed buffer is therefore not a limitation we tolerate — it is the precondition that makes
correspondence-based morphing possible at all. Per-device scaling is still achieved, just at the
right moment (startup) rather than the wrong one (mid-session).

## Consequences

- Morphs are always well-defined; particle identity is stable for the whole session.
- Quality tiers are an _initialization_ concern; a "live quality slider" is intentionally not
  supported and would mean a reload.
- Target providers can assume a fixed `N` and pre-bake to it.
- The dual-target morph (ADR-0003) builds directly on this guarantee.
