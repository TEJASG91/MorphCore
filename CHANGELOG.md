# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses milestone-based
versioning.

## [Unreleased]

### Planned — M3: Scroll-driven narrative

- Dual-target morph (two target sets + `uBlend`) for perfectly reversible scrolling
- `ScrollDirector`, `Scene` data, and `TextTargetProvider`
- Face → name → skills as a scroll-driven sequence
- Current/next scene, blend, and scroll progress in the debug overlay

## [0.2.0] - 2026-07-01 — M2: Living face

### Added

- Motion system: normalised signal sources → `ExpressionMixer` → `FaceController`
- `IdleAnimator` (breathing + drift), `GazeSource` (cursor tracking), `PointerInput`
- `MotionConfig` and a dev-only lil-gui tuning panel (excluded from production)
- Project professionalization: ESLint + Prettier, `docs/` (architecture, runtime, motion,
  morph, roadmap, performance), four ADRs, `.vscode/` workspace config, and CI

### Changed

- Retired the idle auto-orbit; the camera is now a static base pose plus pointer parallax
- Extracted the inline styles to `src/style.css`

## [0.1.0] — M1: Engine core

### Added

- Single `requestAnimationFrame` loop, `TimeController`, hot/cold runtime state, `QualityTiers`
- Fixed-`N` `ParticleSystem` with GPU start→target morph, `MorphEngine`, `TargetProvider`
- `ImageTargetProvider`, the versioned binary asset format, the `System` composition primitive,
  and the debug overlay
