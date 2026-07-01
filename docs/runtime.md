# Runtime

How a frame actually runs, and how state moves through the engine.

## The single loop

There is exactly one `requestAnimationFrame` loop, in [`RenderCore`](../src/core/RenderCore.ts).
It does three things per tick:

1. ask [`TimeController`](../src/core/TimeController.ts) for the scaled delta,
2. call `update(dt)` on every registered [`System`](../src/core/System.ts) in order,
3. render the scene.

Systems are registered with `RenderCore.addSystem(...)`. Order is explicit and meaningful —
input is read before the controllers that consume it, the camera is positioned before the
draw. There is no scheduler and no priority field; the array order _is_ the schedule. That is
the whole "plugin system": composition.

```ts
export interface System {
  update(dt: number): void;
  dispose?(): void;
}
```

`dispose?()` exists for systems that own listeners or GPU resources (e.g. `PointerInput`).
`initialize()` and `resize()` are deliberately **not** on the interface — systems set up in
their constructor, and resize is handled centrally in `RenderCore`. They will be added the day
a system genuinely needs them, not before.

## Time

`TimeController` is the single source of time. It owns:

- **delta** — seconds since the last frame, already multiplied by the speed factor,
- **elapsed** — accumulated scaled time, used by the procedural motion,
- **pause/resume** — freezes delta to 0 without stopping the loop,
- **speed** — a multiplier (`[` / `]` in dev) for slow-mo / fast-forward debugging,
- **reducedMotion** — read from `prefers-reduced-motion`; when set, procedural motion and
  morph auto-advance are disabled and the cloud rests at its target.

Because every system advances from this one delta, pause and speed are global and free — no
system implements them individually.

## State

Runtime state is a **plain mutable object** created by
[`createRuntimeState`](../src/core/runtimeState.ts). It holds the values that change every
frame — pointer position, morph progress, the mixed expression channels, the camera pose. It
is mutated in place and read in place. There is no store, no reducer, no subscription, and
nothing re-renders when it changes.

This is a hot/cold split. Per-frame "hot" values belong here precisely because a React-style
`setState` 60+ times a second is the wrong tool. Discrete "cold" UI state (which scene label is
showing, menu open/closed) would live in normal component state when there is a UI to need it.
Mixing the two is what the split avoids. Reasoning: [ADR-0001](./adr/0001-runtime-state.md).

## Quality

[`QualityTiers`](../src/core/QualityTiers.ts) picks one preset at startup from device hints
(cores, memory, mobile UA), overridable with `?quality=low|medium|high|ultra`. The preset fixes
`N` for the session. Tiers are an _initialization_ choice, not a runtime effect: changing tier
means a reload, because the particle buffer cannot be resized without breaking morph
correspondence. Reasoning: [ADR-0002](./adr/0002-fixed-particle-budget.md).
