import type { RuntimeState } from '../core/runtimeState';
import type { System } from '../core/System';
import type { MotionConfig } from '../behavior/MotionConfig';

/**
 * Captures the pointer, normalizes to [-1, 1] over the canvas, and exponentially smooths it
 * (frame-rate independent) into state.pointer. When the pointer leaves, the target recenters
 * so gaze eases back to rest. Smoothing rate is read from MotionConfig live.
 *
 * Exponential smoothing by design — one line, nothing to tune but the rate. A critically
 * damped spring is a drop-in here if the motion ever feels too laggy; nothing else changes.
 */
export class PointerInput implements System {
  private targetX = 0;
  private targetY = 0;
  private readonly onMove: (e: PointerEvent) => void;
  private readonly onLeave: () => void;

  constructor(
    private state: RuntimeState,
    private el: HTMLElement,
    private config: MotionConfig,
  ) {
    this.onMove = (e) => {
      const r = this.el.getBoundingClientRect();
      this.targetX = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.targetY = -(((e.clientY - r.top) / r.height) * 2 - 1);
      this.state.pointer.active = true;
    };
    this.onLeave = () => {
      this.targetX = 0;
      this.targetY = 0;
      this.state.pointer.active = false;
    };
    this.el.addEventListener('pointermove', this.onMove);
    this.el.addEventListener('pointerleave', this.onLeave);
    window.addEventListener('blur', this.onLeave);
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-this.config.pointerSmoothing * dt);
    const p = this.state.pointer;
    p.x += (this.targetX - p.x) * k;
    p.y += (this.targetY - p.y) * k;
  }

  dispose(): void {
    this.el.removeEventListener('pointermove', this.onMove);
    this.el.removeEventListener('pointerleave', this.onLeave);
    window.removeEventListener('blur', this.onLeave);
  }
}
