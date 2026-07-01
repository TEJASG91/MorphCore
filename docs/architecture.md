# Architecture

## Philosophy

One rule drives every decision in this codebase:

> **Abstractions are extracted from real instances, not guessed up front.**

We build the simplest thing that solves the problem in front of us, and we only generalise
when a _second_ or _third_ concrete use proves what the abstraction should be. A registry, an
event bus, or a plugin framework with zero real consumers is not architecture — it is
speculation that has to be maintained. Most of the engineering effort here has gone into
_deciding what not to build yet_; the decisions and their reasoning live in
[`adr/`](./adr).

Three consequences of that rule shape the whole engine:

- **Composition over frameworks.** Per-frame logic is expressed as small [`System`](../src/core/System.ts)
  objects registered in order, not as a discovery/lifecycle framework.
- **A stable particle buffer.** The particle count `N` is chosen _once_ at startup and never
  changes, because per-particle morph correspondence depends on a fixed buffer. See
  [ADR-0002](./adr/0002-fixed-particle-budget.md).
- **Hot/cold state separation.** Values mutated every frame live in a plain mutable object;
  discrete UI state would live elsewhere. No per-frame framework re-renders. See
  [ADR-0001](./adr/0001-runtime-state.md).

## Module map

```
src/
├── core/        engine spine — render loop, time, state, camera, quality, System interface
│   ├── RenderCore.ts        renderer + single rAF loop + resize + ordered System[]
│   ├── TimeController.ts     delta/elapsed/pause/speed; the one clock
│   ├── runtimeState.ts       hot per-frame state (mutable object)
│   ├── CameraController.ts    static base pose + pointer parallax
│   ├── QualityTiers.ts        startup presets; picks N once
│   └── System.ts             { update(dt); dispose?() } — the composition primitive
│
├── particles/   the one fixed-N point cloud
│   ├── ParticleSystem.ts     owns the buffer; morphs start→target on the GPU
│   └── shaders.ts            additive soft-point vertex/fragment shaders
│
├── morph/       what the cloud forms
│   ├── MorphEngine.ts        owns morphT; swaps providers; scrub seam for M3
│   └── types.ts              TargetData + TargetProvider
│
├── providers/   sources of particle targets
│   ├── ImageTargetProvider.ts  image → brightness-relief target
│   └── defaultFace.ts          placeholder face
│
├── io/
│   └── BinaryLoader.ts       versioned .bin target format (runtime read)
│
├── behavior/    the "living" layer (see motion-system.md)
│   ├── MotionConfig.ts        live-tunable parameters
│   ├── ExpressionSource.ts    a motion signal
│   ├── IdleAnimator.ts        breathing + drift signal
│   ├── GazeSource.ts          look-toward-cursor signal
│   ├── ExpressionMixer.ts     sums signals → one ExpressionState
│   └── FaceController.ts      maps mixed state → cloud transform
│
├── input/
│   └── PointerInput.ts       pointer → smoothed state.pointer
│
└── debug/       dev-only, excluded from production
    ├── DebugOverlay.ts       fps/N/morphT/draw-calls HUD (backtick toggle)
    └── TuningPanel.ts        lil-gui motion tuner (dynamic import)
```

## Locked contracts

These are extended _additively_; they are never broken:

- A single `requestAnimationFrame` loop in `RenderCore`.
- A fixed particle buffer (`N` per session).
- Hot per-frame state as a plain mutable object.
- The `TargetProvider`, `System`, and `CameraController` interfaces.
- A versioned binary asset format.
- Scroll drives morphing as a **scrub** (a function of scroll position), never as one-shot
  triggers — so motion is perfectly reversible. (Implemented in M3.)

## Data flow per frame

```
TimeController ──dt──► Systems (in order):
  PointerInput        pointer → state.pointer
  FaceController      mix idle+gaze signals → transform the cloud's Points object
  MorphEngine         advance morphT → set shader uniform
  CameraController    base pose + pointer parallax → camera
  ParticleSystem      (GPU) interpolate start→target by morphT
  DebugOverlay        read-only HUD            (dev only)
```

Note that motion (`FaceController`) transforms the `Points` _object_ — rotation, scale,
position — and never rewrites the particle buffer. That keeps it O(1) per frame regardless of
`N`.
