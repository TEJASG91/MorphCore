# Motion system

The "living" layer — what makes the cloud feel like a face that is alive rather than a static
scatter of points. It is the M2 deliverable.

## The shape: signals → mixer → controller

Every source of motion is a **signal** that writes into a shared, normalised
[`ExpressionState`](../src/core/runtimeState.ts) (channels in `-1..1`: head yaw/pitch, gaze,
breath, and the M4-reserved blink/smile). One [`ExpressionMixer`](../src/behavior/ExpressionMixer.ts)
sums all signals and clamps. One [`FaceController`](../src/behavior/FaceController.ts) reads the
mixed result and applies it to the cloud.

```
IdleAnimator ─┐
              ├─► ExpressionMixer (additive sum + clamp) ─► FaceController ─► Points transform
GazeSource ───┘
```

Why this shape: there are two real signal sources today (idle, gaze) and a known third coming
in M4 (webcam-driven expression). Two concrete instances plus a confirmed third is exactly the
bar for extracting the abstraction — so the mixer is justified, not speculative.
[ADR-0004](./adr/0004-expression-system.md) records the call, including what was deliberately
left out (per-signal weights/priority — deferred until an M4 crossfade needs them).

## The signals

- [`IdleAnimator`](../src/behavior/IdleAnimator.ts) — the procedural "alive" baseline:
  a breathing sine, plus head drift and eye wander built from **summed sines with irrational
  frequency ratios**. Irrational ratios never produce a visibly repeating loop, cost almost
  nothing, and need no noise library.
- [`GazeSource`](../src/behavior/GazeSource.ts) — turns the smoothed pointer into a
  "look toward the cursor" contribution. Pointer is just another signal, mixed with idle drift
  rather than special-cased.

## The controller

`FaceController` maps the mixed, normalised channels to physical units and applies them to the
particle cloud's `Points` **object** — rotation, scale, position — and nothing else. It never
touches the particle buffer, so it is O(1) per frame at any `N`. Under `prefers-reduced-motion`
it zeroes the transform and the cloud sits still.

Mapping examples: `headYaw × yawLimit → rotation.y`, `breath × breathAmp → scale`,
`breath × floatAmount → position.y`.

## Tuning

All feel-knobs live in one place: [`MotionConfig`](../src/behavior/MotionConfig.ts). The
systems read it **every frame**, so changes apply live. In development a lil-gui panel
([`TuningPanel`](../src/debug/TuningPanel.ts)) binds to that object — drag a slider and the face
responds immediately. When the motion feels right, the panel's "log values" button prints the
config as JSON to paste back into `defaultMotionConfig()` so the shipping build uses the tuned
values.

The panel and lil-gui are loaded through a dev-only dynamic import, so neither ships in the
production bundle. Tuning target: a visitor should not _notice_ the animation; they should feel
the face is alive.

## Camera, briefly

`CameraController` holds a static base pose (from `state.camera`) and adds a small
pointer-driven parallax. The head turns toward the cursor; the world does not orbit. That is a
deliberate anti-motion-sickness choice — the M1 idle auto-orbit was retired in M2 because it
fought the gaze signal.
