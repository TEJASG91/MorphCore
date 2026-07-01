import type { ExpressionState } from '../core/runtimeState';
import type { ExpressionSource, ExpressionContext } from './ExpressionSource';
import type { MotionConfig } from './MotionConfig';

/**
 * The procedural "alive" signal: breathing + quasi-periodic head drift + micro eye wander.
 * Summed sines with irrational frequency ratios never visibly loop, cost ~nothing, and need
 * no noise library. Reads MotionConfig live, so the tuning panel changes the feel instantly.
 */
export class IdleAnimator implements ExpressionSource {
  readonly id = 'idle';

  constructor(private config: MotionConfig) {}

  contribute(out: ExpressionState, ctx: ExpressionContext): void {
    const t = ctx.time;
    const c = this.config;

    // breathing — genuinely periodic
    out.breath += Math.sin(t * c.breathFreq);

    // head drift — summed sines with irrational ratios (scaled by amp/freq)
    const f = c.driftFreq;
    const a = c.driftAmp;
    out.headYaw += a * (0.16 * Math.sin(t * f * 0.17) + 0.1 * Math.sin(t * f * Math.SQRT2 * 0.11));
    out.headPitch +=
      a * (0.12 * Math.sin(t * f * Math.PI * 0.08) + 0.08 * Math.sin(t * f * Math.E * 0.05));

    // micro eye wander
    out.gaze.x += a * 0.1 * Math.sin(t * f * 0.31);
    out.gaze.y += a * 0.08 * Math.sin(t * f * 0.27 + 1.3);
  }
}
