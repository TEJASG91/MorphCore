# 4. Expression system: signals → mixer → controller

- Status: Accepted
- Context date: Milestone 2

## Context

The cloud needed to feel alive: idle breathing and head drift, plus looking toward the cursor,
with a known future source (webcam-driven expression in M4). We had to decide how multiple,
independent motion sources combine and reach the particle cloud.

## Decision

Model every motion source as a **signal** (`ExpressionSource`) that writes into a shared,
normalised `ExpressionState` (channels in `-1..1`). One `ExpressionMixer` additively sums all
signals and clamps. One `FaceController` reads the mixed result and maps it to a transform on
the particle cloud's `Points` object.

## Rationale

There were two real sources at M2 (idle, gaze) and a confirmed third coming in M4 (webcam).
Two concrete instances plus a known third is exactly the threshold for extracting an
abstraction — below it we would be guessing, at it the shape is evidenced. Normalising every
signal to `-1..1` means sources compose without knowing about each other or about physical
units; the controller is the single place that turns abstract channels into radians and scale,
which keeps "how a face moves" in one file.

Applying motion to the `Points` _object_ (rotation/scale/position) rather than the particle
buffer keeps it O(1) per frame at any `N` and changes no engine contract.

We deliberately kept the mixer **additive only** — no per-signal weights or priorities. There is
no real consumer for weighting yet; it is reserved for an M4 crossfade (e.g. blending from
webcam-driven to idle when the face is lost). Adding it now would be a speculative parameter to
maintain.

## Consequences

- New motion sources are added by writing one more signal; nothing else changes.
- The M4 webcam source drops into the same mixer with no rearchitecting.
- Per-signal weighting is a known, scoped future addition, not an omission.
- Motion is decoupled from morphing: both can run independently on the same cloud.
