# 1. Runtime state as a plain mutable object

- Status: Accepted
- Context date: Milestone 1

## Context

The engine mutates a set of values every frame — pointer position, morph progress, the mixed
expression channels, the camera pose — at 60+ Hz. It also has discrete UI-ish state (which
quality tier, eventually which scene label is on screen). We needed to decide how state is held.

## Decision

Hold per-frame "hot" state in a **plain mutable object** (`createRuntimeState`), mutated and
read in place. No store, reducer, subscription, or framework. Discrete "cold" state will live in
ordinary component/local state if and when a UI needs it.

## Rationale

A React/Zustand-style `setState` is designed for discrete, render-triggering updates. Driving it
60+ times a second to push particle progress or a smoothed pointer is the wrong tool: it adds
allocation, comparison, and re-render machinery to a path whose entire job is to be fast and run
constantly. The values are read by other systems in the same frame, in order, so plain mutation
is both the simplest and the fastest option.

The hot/cold split is the actual decision. Keeping the two kinds of state physically separate
prevents the common failure where per-frame values get entangled in a UI state container and
quietly wreck performance.

## Consequences

- Per-frame updates are allocation-free and trivially fast.
- No reactivity: nothing "subscribes" to runtime state; systems read it directly each frame.
- A future UI layer uses its own state mechanism for discrete state and reads hot values from
  runtime state — the boundary is explicit, not blurred.
