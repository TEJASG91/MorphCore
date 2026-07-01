/**
 * A unit of per-frame engine logic with optional teardown. This is the deliberate,
 * lean replacement for a "plugin system": composition over a registry.
 *
 * Systems are registered with RenderCore in order and updated each frame from the
 * TimeController's delta. M2's input/face systems and M4's webcam/audio systems implement
 * this same interface — no discovery or lifecycle machinery required.
 */
export interface System {
  /** advance one frame; dt is scaled delta seconds from the TimeController. */
  update(dt: number): void;
  /** optional cleanup: remove listeners, dispose GPU resources. */
  dispose?(): void;
}
