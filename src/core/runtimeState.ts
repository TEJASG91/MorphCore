// The single source of truth, read and written inside the render loop.
// One mutable object, injected into every system. This is the ONLY mutable shared state
// (coding standard: no global mutable state outside the runtime store).
//
// IMPORTANT: this is HOT state — it changes every frame. It must never be wired to React
// or Zustand setState, which would fire a render per frame. UI ("cold") state lives
// separately (see README).

import type { QualityTier } from './QualityTiers';

/** Per-frame "expression" of the face, as NORMALIZED signals (producers add into these,
 *  the mixer clamps, FaceController maps to physical units). Present from M1 so downstream
 *  systems can target it without a contract change. */
export interface ExpressionState {
  gaze: { x: number; y: number }; // -1..1 look direction
  headYaw: number; // -1..1 (FaceController maps to radians)
  headPitch: number; // -1..1 (FaceController maps to radians)
  blink: number; // 0 open .. 1 closed (M4)
  smile: number; // 0..1 (M4)
  breath: number; // -1..1 breathing phase
}

export interface CameraState {
  azimuth: number; // radians around +Y
  polar: number; // radians from +Y
  radius: number; // distance to target
  target: { x: number; y: number; z: number };
}

export interface RuntimeState {
  time: number; // seconds since start
  dt: number; // seconds since last frame
  frame: number; // frame counter

  quality: QualityTier;
  /** resolved N, fixed for the session. */
  particleCount: number;

  scene: string; // active scene id (e.g. 'face')
  morphT: number; // 0..1 progress of the current morph

  camera: CameraState;
  expression: ExpressionState;

  /** normalized pointer, -1..1 (consumed from M2). */
  pointer: { x: number; y: number; active: boolean };
}

export function createRuntimeState(quality: QualityTier, particleCount: number): RuntimeState {
  return {
    time: 0,
    dt: 0,
    frame: 0,
    quality,
    particleCount,
    scene: 'none',
    morphT: 1,
    camera: { azimuth: 0.42, polar: Math.PI / 2 - 0.1, radius: 5.6, target: { x: 0, y: 0, z: 0 } },
    expression: { gaze: { x: 0, y: 0 }, headYaw: 0, headPitch: 0, blink: 0, smile: 0, breath: 0 },
    pointer: { x: 0, y: 0, active: false },
  };
}
