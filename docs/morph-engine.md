# Morph engine

How the cloud changes form: the particle buffer, the morph, where targets come from, and how
they are stored.

## The fixed buffer

[`ParticleSystem`](../src/particles/ParticleSystem.ts) owns one buffer of `N` particles, where
`N` is fixed for the session by the quality tier. Each particle has a `start` position and a
`target` position; the GPU interpolates between them by a single `uMorphT` uniform in
[`shaders.ts`](../src/particles/shaders.ts). Points are rendered additively as soft sprites, so
overlapping particles glow.

The buffer never resizes. This is the load-bearing constraint of the whole engine: morphing
requires a stable correspondence between particle _i_ in shape A and particle _i_ in shape B.
Resize the buffer and that correspondence is gone. Reasoning:
[ADR-0002](./adr/0002-fixed-particle-budget.md).

## The morph

[`MorphEngine`](../src/morph/MorphEngine.ts) owns `morphT` and advances it (or, from M3, lets
scroll _set_ it directly — the scrub seam). Calling `setProvider(...)` loads a new target and
morphs to it. Today the engine is **single-target**: it interpolates from the current positions
to one target.

## Targets and providers

A target is plain data:

```ts
interface TargetData {
  count: number;
  positions: Float32Array; // xyz per particle
  colors: Float32Array; // rgb per particle
  sizes: Float32Array; // per particle
}

interface TargetProvider {
  load(maxParticles: number): Promise<TargetData> | TargetData;
}
```

Any source that can fill those arrays is a provider:

- [`ImageTargetProvider`](../src/providers/ImageTargetProvider.ts) — samples an image,
  deterministically subsamples into `N` particles, and uses brightness as depth relief.
- [`defaultFace`](../src/providers/defaultFace.ts) — a placeholder grayscale face.
- `TextTargetProvider` (M3) — name and skill words.

Providers know nothing about portfolios, scenes, or each other. That content-agnosticism is why
the same engine can drive entirely different experiences.

## Binary asset format

[`BinaryLoader`](../src/io/BinaryLoader.ts) defines a **versioned** `.bin` target format
(magic `PTGT`, a format version, a generator version, count, and bounds, followed by the packed
arrays). Binary is dramatically smaller and faster to parse than JSON for hundreds of thousands
of floats. Versioning means a future format change can be detected and handled rather than
silently corrupting old baked assets. At runtime the engine only _reads_ `.bin`; an offline bake
step is future work.

## Planned: dual-target morph (M3)

M3 introduces the one core extension this architecture has been preserved for. `ParticleSystem`
gains a _second_ target set and a `uBlend` uniform; a `ScrollDirector` sets target A =
scene _i_, target B = scene _i+1_, and `uBlend` = the fractional scroll between them. Buffer
swaps happen only at integer scene boundaries — the instant particles sit exactly on a scene —
so scrolling is a pure, stateless, perfectly reversible GPU blend with no snapping in either
direction. It also subsumes the existing random→face assemble (A = random, B = face). Design and
trade-offs: [ADR-0003](./adr/0003-dual-target-design.md).
