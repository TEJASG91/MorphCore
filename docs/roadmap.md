# Roadmap

Milestone-based. Each milestone is closed (built, typechecked, lint-clean, tagged) before the
next opens. Abstractions are added when a real second/third use justifies them, not in advance.

## ✅ M1 — Engine core

The spine: single render loop, `TimeController`, hot/cold `runtimeState`, `QualityTiers`
(fixes `N` once), the fixed-`N` `ParticleSystem` with GPU start→target morph, `MorphEngine`,
the `TargetProvider` interface, `ImageTargetProvider`, the versioned binary format, and the
`System` composition primitive. A hardening pass added the things that protect persisted
artifacts (versioned format) or earn their keep now (central clock, expanded debug overlay) —
and deliberately _declined_ an event bus, asset manager, scheduler, and plugin framework as
premature. Tag: `v0.1`.

## ✅ M2 — Living face

The motion layer: `PointerInput`, `IdleAnimator`, `GazeSource`, `ExpressionMixer`,
`FaceController`, all under "every motion source is a normalised signal → one mixer → one
applier." The cloud breathes, drifts, and looks toward the cursor — all via `Points`-object
transforms, zero buffer or shader changes. The idle auto-orbit was retired; the camera is now a
static base pose plus pointer parallax. A dev-only `MotionConfig` + lil-gui tuning panel makes
the feel tunable by eye. Tag: `v0.2-living-face`.

## ▶ M3 — Scroll-driven narrative (next)

Scope, intentionally small:

- **Dual-target morph** — two target sets + a `uBlend` uniform (the one justified core
  extension; see [ADR-0003](./adr/0003-dual-target-design.md)).
- **ScrollDirector** — lightweight: pick current/next scene, compute blend, interpolate camera,
  drive the morph. No UI, lighting, audio, or lifecycle.
- **Scene as data** — `{ id; target; camera }`. No hooks or callbacks.
- **TextTargetProvider** — enough for name + skill words.
- Placeholder content: Face → name → skills.
- Debug overlay gains current/next scene, blend, and scroll progress.

Success bar: one continuous sculpture changing form, an identical path scrolling up and down,
zero snapping.

## M4 — Expression & polish (future)

Candidates, each gated on a real need: webcam-driven expression (MediaPipe) feeding a third
signal into the existing mixer; blink / smile / eye deformation (needs eye-region particles);
per-signal mixer weights for crossfades; an offline asset bake step; a bloom/post pass; richer
scenes (projects, contact). Branding and open-sourcing are an _outcome_ of building one
excellent thing — revisited after M4, not engineered toward now.
