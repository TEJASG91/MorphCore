import type { RuntimeState, ExpressionState } from '../core/runtimeState';

/** What a signal source sees each frame. */
export interface ExpressionContext {
  time: number; // scaled elapsed seconds (from TimeController)
  dt: number;
  state: RuntimeState; // sources may read e.g. state.pointer
}

/**
 * A normalized motion signal. Each source ADDS its contribution into `out` — it never
 * reads other sources, never touches the renderer. Idle, gaze (and later webcam, timeline)
 * all implement this, so the mixer treats every source identically.
 */
export interface ExpressionSource {
  readonly id: string;
  contribute(out: ExpressionState, ctx: ExpressionContext): void;
}

export function resetExpression(e: ExpressionState): void {
  e.gaze.x = 0;
  e.gaze.y = 0;
  e.headYaw = 0;
  e.headPitch = 0;
  e.blink = 0;
  e.smile = 0;
  e.breath = 0;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function clampExpression(e: ExpressionState): void {
  e.gaze.x = clamp(e.gaze.x, -1, 1);
  e.gaze.y = clamp(e.gaze.y, -1, 1);
  e.headYaw = clamp(e.headYaw, -1, 1);
  e.headPitch = clamp(e.headPitch, -1, 1);
  e.blink = clamp(e.blink, 0, 1);
  e.smile = clamp(e.smile, 0, 1);
  e.breath = clamp(e.breath, -1, 1);
}
