import type { RuntimeState } from '../core/runtimeState';
import type { ParticleSystem } from '../particles/ParticleSystem';
import type { TargetProvider } from './types';
import type { System } from '../core/System';

/**
 * Owns the *progress* of morphs and the active target provider.
 *
 * M1: auto-advances morphT over a fixed duration (the "assemble" animation).
 * M3: scroll drives morphT directly via setMorphT() and auto-advance is disabled —
 *     nothing else here changes. That's the seam that makes scroll scrubbing additive.
 */
export class MorphEngine implements System {
  private autoAdvance = true;
  private duration = 2.6; // seconds
  private elapsed = 0;

  constructor(
    private particles: ParticleSystem,
    private state: RuntimeState,
  ) {}

  /** Load a provider's targets at the fixed budget and begin the morph into them. */
  async setProvider(provider: TargetProvider): Promise<void> {
    const data = await provider.load(this.state.particleCount);
    this.particles.setTargets(data);
    this.state.scene = provider.id;
    this.elapsed = 0;
    if (this.autoAdvance) this.state.morphT = 0;
  }

  /** Drive progress externally (scroll scrubbing, M3+). Disables auto-advance. */
  setMorphT(t: number): void {
    this.autoAdvance = false;
    this.state.morphT = Math.min(1, Math.max(0, t));
  }

  setAutoAdvance(on: boolean): void {
    this.autoAdvance = on;
  }

  update(dt: number): void {
    if (!this.autoAdvance) return;
    this.elapsed = Math.min(this.duration, this.elapsed + dt);
    this.state.morphT = this.elapsed / this.duration;
  }
}
