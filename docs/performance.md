# Performance baseline

A reference point captured at the end of M2, before M3 adds the second target set. Two kinds of
number here: **build/static** facts (measured from the production build and the source, so they
are authoritative) and **device** facts (FPS, memory, startup — these depend on the machine and
are read off the debug overlay; the table has blanks for you to fill on your target devices).

## Build / static (measured)

Production build (`npm run build`):

| Artifact   | Raw       | Gzip      |
| ---------- | --------- | --------- |
| JS bundle  | 482.83 kB | 123.18 kB |
| CSS        | 0.46 kB   | 0.31 kB   |
| index.html | 0.66 kB   | 0.41 kB   |

- Runtime dependencies: **`three` only.** lil-gui and the debug/tuning UI are dev-only and are
  excluded from this bundle (verified: the bundle size is unchanged with them added).
- The JS source map (~2 MB) is dev tooling and is not served to users.

## Particle budget per tier (from `QualityTiers`)

| Tier   | `N` particles | renderScale | maxPixelRatio |
| ------ | ------------- | ----------- | ------------- |
| low    | 20,000        | 0.75        | 1.5           |
| medium | 50,000        | 1.0         | 2             |
| high   | 100,000       | 1.0         | 2             |
| ultra  | 150,000       | 1.0         | 2             |

Approx geometry attribute memory ≈ `N × ~10 floats × 4 bytes` (start xyz, target xyz, color
rgb, size) → roughly 0.8 / 2 / 4 / 6 MB for low / medium / high / ultra. M3's dual-target adds a
second target set (a few MB more at Ultra).

## Draw calls

**1** for the particle cloud (a single `Points` object). The HUD is DOM, not WebGL. Read the
live value as `drawCalls` in the debug overlay.

## Device (fill in from the debug overlay)

Toggle the overlay with the backtick (`` ` ``) key; it shows `fps`, `frameMs`, `jsHeap`, and
`drawCalls` live. Record steady-state values after ~10 s on each device, at the tier that device
auto-selects (and optionally forced tiers via `?quality=`).

| Device / GPU            | Tier | `N` | FPS | frameMs | JS heap | Startup\* |
| ----------------------- | ---- | --- | --- | ------- | ------- | --------- |
| _e.g. M2 MacBook Air_   |      |     |     |         |         |           |
| _e.g. mid-range laptop_ |      |     |     |         |         |           |
| _e.g. Android phone_    |      |     |     |         |         |           |

\* Startup = time to first rendered frame. Optional; measure with `performance.now()` around
boot if you want it. `jsHeap` is Chromium-only.

## How to keep this honest

Re-capture after M3 (dual-target morph + scroll) and after any change that touches the buffer,
the shader, or `N`. The single biggest lever on FPS is `N`, which is why it is a startup choice
(ADR-0002), not a runtime one.
