import type { ExpressionState } from '../core/runtimeState';
import type { ExpressionSource, ExpressionContext } from './ExpressionSource';
import type { MotionConfig } from './MotionConfig';

/**
 * Turns the smoothed pointer into a "look toward the cursor" signal — pointer is just
 * another signal source, combined with idle drift by the mixer. Reads the gaze weight from
 * MotionConfig live.
 */
export class GazeSource implements ExpressionSource {
  readonly id = 'gaze';

  constructor(private config: MotionConfig) {}

  contribute(out: ExpressionState, ctx: ExpressionContext): void {
    const p = ctx.state.pointer;
    const w = this.config.pointerSensitivity;
    out.headYaw += p.x * w;
    out.headPitch += p.y * w;
    out.gaze.x += p.x;
    out.gaze.y += p.y;
  }
}
