import type * as THREE from 'three';
import type { RuntimeState } from '../core/runtimeState';
import type { System } from '../core/System';
import type { TimeController } from '../core/TimeController';
import type { ExpressionMixer } from './ExpressionMixer';
import type { MotionConfig } from './MotionConfig';

const LEAN = 0.05; // world units the cloud leans toward the cursor (small; not panel-exposed)

/**
 * Reads the mixed ExpressionState and applies it to the particle cloud by transforming the
 * `Points` OBJECT only — rotation / scale / position. Never touches the particle buffer, so
 * it's O(1) per frame and changes no engine contract. Maps normalized channels to physical
 * units using MotionConfig (read live, so the tuning panel updates the feel instantly).
 */
export class FaceController implements System {
  constructor(
    private state: RuntimeState,
    private mixer: ExpressionMixer,
    private points: THREE.Points,
    private time: TimeController,
    private config: MotionConfig,
  ) {}

  update(dt: number): void {
    if (this.time.reducedMotion) {
      this.points.rotation.set(0, 0, 0);
      this.points.scale.setScalar(1);
      this.points.position.set(0, 0, 0);
      return;
    }

    const e = this.mixer.mix({ time: this.state.time, dt, state: this.state });

    // mirror into runtime state so other systems / the debug overlay can read it
    const x = this.state.expression;
    x.gaze.x = e.gaze.x;
    x.gaze.y = e.gaze.y;
    x.headYaw = e.headYaw;
    x.headPitch = e.headPitch;
    x.breath = e.breath;
    x.blink = e.blink;
    x.smile = e.smile;

    const c = this.config;
    this.points.rotation.y = e.headYaw * c.yawLimit;
    this.points.rotation.x = e.headPitch * c.pitchLimit;
    this.points.scale.setScalar(1 + e.breath * c.breathAmp);
    this.points.position.set(e.gaze.x * LEAN, e.breath * c.floatAmount + e.gaze.y * LEAN, 0);
  }
}
