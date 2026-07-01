// Contracts for turning *content* into particle targets. The engine knows only these
// shapes — never what a "skill", "project", or "face" is. (Content vs engine separation.)

/** A baked set of particle targets. Arrays are tightly packed; `count` ≤ the engine's N. */
export interface TargetData {
  /** number of ACTIVE particles (the rest of the budget stays transparent). */
  count: number;
  positions: Float32Array; // count * 3  (x, y, z) in world units
  colors: Float32Array; // count * 3  (r, g, b) in 0..1
  sizes: Float32Array; // count      per-particle size multiplier
}

/** Anything that can produce targets for the fixed particle budget. */
export interface TargetProvider {
  readonly id: string;
  /** Produce ≤ maxParticles targets. Implementations map/subsample into the budget. */
  load(maxParticles: number): Promise<TargetData>;
}
