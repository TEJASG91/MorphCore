# MorphCore

A reusable **GPU particle-morphing engine** built with TypeScript and Three.js. A single fixed
cloud of particles is sculpted into different shapes — a face, words, scenes — and morphed
between them entirely on the GPU. Its first application is an interactive portfolio, but the
engine knows nothing about portfolios; that separation is the point.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r169-000000?logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![code style: prettier](https://img.shields.io/badge/code_style-prettier-F7B93E?logo=prettier&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## Demo

<!-- Replace with a short screen capture of the live engine, e.g. docs/media/demo.gif -->

_A short capture of the running engine goes here — the particle face breathing and tracking the
cursor, and (after M3) morphing on scroll._

## What it does today

- A fixed-`N` particle cloud (20k–150k by device tier) that morphs **start → target** on the GPU.
- An **image importer**: drop in a photo and the cloud forms it, using brightness as depth.
- A **living face** — procedural breathing and head drift, plus gaze that follows the cursor —
  applied as a cheap object transform, never a buffer rewrite.
- A **dev tuning panel** to dial the motion by eye, and a **debug HUD** (fps, `N`, morph
  progress, draw calls). Both are stripped from production builds.

## Tech stack

TypeScript (strict) · Three.js (vanilla, no React/R3F) · Vite · ESLint + Prettier. The only
runtime dependency is `three`. No state library, no GSAP/Lenis, no post-processing yet — each
will be added only when a milestone genuinely needs it.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build        # typecheck + production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write
```

In dev: backtick (`` ` ``) toggles the debug HUD; the motion tuning panel appears top-right;
`space` pauses, `[` / `]` change time speed. Force a quality tier with `?quality=low|medium|high|ultra`.

## Project structure

```
src/
├── core/        render loop, time, runtime state, camera, quality, System interface
├── particles/   the fixed-N point cloud + shaders
├── morph/       MorphEngine + target types
├── providers/   image / placeholder target sources
├── io/          versioned binary asset format
├── behavior/    the living-face layer (signals → mixer → controller)
├── input/       pointer
└── debug/       dev-only HUD + tuning panel
docs/            architecture, runtime, motion, morph, roadmap, performance, ADRs
```

## Documentation

- [Architecture](docs/architecture.md) — philosophy, module map, locked contracts
- [Runtime](docs/runtime.md) — the loop, time, state, systems
- [Motion system](docs/motion-system.md) — how the face is made to feel alive
- [Morph engine](docs/morph-engine.md) — buffer, morph, providers, binary format
- [Roadmap](docs/roadmap.md) — milestone status and forward plan
- [Performance](docs/performance.md) — baseline + per-device template
- [Architecture Decision Records](docs/adr) — the reasoning behind the key choices

## Architecture philosophy

One rule drives the codebase: **abstractions are extracted from real instances, not guessed up
front.** The hardest engineering here has been deciding what _not_ to build yet — an event bus,
plugin framework, and asset manager were all considered and deliberately declined while they had
zero real consumers. What exists is justified now; what's deferred is recorded in the
[ADRs](docs/adr) with its reasoning. See [Architecture](docs/architecture.md).

## Roadmap

- **M1 — Engine core** ✅ render loop, fixed buffer, GPU morph, providers, binary format
- **M2 — Living face** ✅ signal/mixer motion system, gaze, tuning panel
- **M3 — Scroll-driven narrative** ▶ dual-target morph, ScrollDirector, scene data, text targets
- **M4 — Expression & polish** webcam-driven expression, blink/smile, post FX

Details and success criteria in the [roadmap](docs/roadmap.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: read the ADRs first, keep changes
small and milestone-shaped, and don't add infrastructure without a real second use for it.

## License

[MIT](LICENSE).
