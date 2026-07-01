import * as THREE from 'three';
import type { RuntimeState } from './runtimeState';
import type { System } from './System';
import type { MotionConfig } from '../behavior/MotionConfig';

/**
 * Reads the (static) base camera pose from runtime state and adds a small pointer-driven
 * parallax (amount from MotionConfig). The M1 idle auto-orbit is retired — it fought gaze.
 * From M3 the timeline animates the base pose via state.camera; this controller keeps
 * reading it + adding parallax, unchanged.
 */
export interface ICameraController {
  update(dt: number): void;
}

export class CameraController implements ICameraController, System {
  constructor(
    private camera: THREE.PerspectiveCamera,
    private state: RuntimeState,
    private reducedMotion: boolean,
    private config: MotionConfig,
  ) {}

  update(_dt: number): void {
    const cam = this.state.camera;
    const sway = this.reducedMotion ? 0 : this.config.cameraParallax;
    const az = cam.azimuth + this.state.pointer.x * sway;
    const polar = Math.min(Math.PI - 0.2, Math.max(0.2, cam.polar - this.state.pointer.y * sway));

    const sp = Math.sin(polar);
    this.camera.position.set(
      cam.radius * sp * Math.sin(az),
      cam.radius * Math.cos(polar),
      cam.radius * sp * Math.cos(az),
    );
    this.camera.lookAt(cam.target.x, cam.target.y, cam.target.z);
  }
}
