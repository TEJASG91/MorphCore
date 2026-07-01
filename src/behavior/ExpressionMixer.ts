import type { ExpressionState } from '../core/runtimeState';
import { resetExpression, clampExpression } from './ExpressionSource';
import type { ExpressionSource, ExpressionContext } from './ExpressionSource';

/**
 * Combines normalized motion signals into one ExpressionState.
 *
 * M2 is purely ADDITIVE: each source adds its contribution, then we clamp. Weighted
 * blending — needed only when one source must crossfade out another (e.g. webcam replacing
 * procedural gaze in M4) — is a one-line addition (multiply each contribution by a weight),
 * deliberately omitted until that real case exists.
 *
 * This is the seam: M4 webcam = `mixer.add(new WebcamSource())`. Nothing else changes.
 */
export class ExpressionMixer {
  private sources: ExpressionSource[] = [];
  private readonly out: ExpressionState = {
    gaze: { x: 0, y: 0 },
    headYaw: 0,
    headPitch: 0,
    blink: 0,
    smile: 0,
    breath: 0,
  };

  add(source: ExpressionSource): void {
    this.sources.push(source);
  }

  mix(ctx: ExpressionContext): ExpressionState {
    resetExpression(this.out);
    for (const s of this.sources) s.contribute(this.out, ctx);
    clampExpression(this.out);
    return this.out;
  }
}
