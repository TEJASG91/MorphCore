/**
 * The central clock. Everything time-based reads from here, so global pause, slow-motion,
 * speed, and reduced-motion live in one place. RenderCore feeds it the wall-clock delta
 * once per frame; systems consume `delta` / `elapsed`.
 *
 * Supports M2 (idle animation), M3 (timeline), and dev workflow (pause/scrub). Fixed-step
 * is reserved for a future deterministic sim (e.g. M4 physics) and is inert until used.
 */
export class TimeController {
  /** scaled seconds since the last frame (0 while paused). */
  delta = 0;
  /** scaled seconds since start. */
  elapsed = 0;

  private speed = 1;
  private paused = false;

  // fixed-timestep accumulator — inert until a system calls consumeFixedSteps().
  private accumulator = 0;
  readonly fixedStep = 1 / 60;

  constructor(readonly reducedMotion = false) {}

  /** Advance by a raw wall-clock delta (seconds). Called once per frame by RenderCore. */
  tick(rawDelta: number): void {
    const scaled = this.paused ? 0 : rawDelta * this.speed;
    this.delta = scaled;
    this.elapsed += scaled;
    this.accumulator += scaled;
  }

  /** Drain whole fixed steps for deterministic systems. Returns how many to run. */
  consumeFixedSteps(): number {
    let steps = 0;
    while (this.accumulator >= this.fixedStep) {
      this.accumulator -= this.fixedStep;
      steps++;
    }
    return steps;
  }

  pause(): void {
    this.paused = true;
  }
  resume(): void {
    this.paused = false;
  }
  togglePause(): void {
    this.paused = !this.paused;
  }
  get isPaused(): boolean {
    return this.paused;
  }

  setSpeed(s: number): void {
    this.speed = Math.max(0, s);
  }
  get currentSpeed(): number {
    return this.speed;
  }
}
