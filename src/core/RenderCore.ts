import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import type { RuntimeState } from './runtimeState';
import type { QualityConfig } from './QualityTiers';
import type { TimeController } from './TimeController';
import type { System } from './System';

/**
 * Owns the renderer, the (currently pass-through) post-processing composer, the SINGLE
 * requestAnimationFrame loop, and resize.
 *
 * Each frame it: feeds wall-clock delta to the TimeController, mirrors time into the
 * runtime state, updates every registered System in registration order, then renders the
 * composer. Systems are how features attach (composition, not a plugin registry).
 *
 * Adding bloom / DOF later (M4) = pushing passes onto `composer`. The loop never changes.
 */
export class RenderCore {
  readonly renderer: THREE.WebGLRenderer;
  readonly composer: EffectComposer;

  /** Wired by main: react to pixel-ratio changes (e.g. update point size). */
  onResize: (pixelRatio: number) => void = () => {};

  private systems: System[] = [];
  private last = 0;
  private running = false;

  constructor(
    private state: RuntimeState,
    private quality: QualityConfig,
    private time: TimeController,
    readonly scene: THREE.Scene,
    readonly camera: THREE.PerspectiveCamera,
    private mount: HTMLElement,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setClearColor(0x05060e, 1);
    mount.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    // M4: this.composer.addPass(new UnrealBloomPass(...)) — sized via quality.bloomResolutionScale

    this.resize();
    window.addEventListener('resize', this.resize);
  }

  /** Register a per-frame system. Order matters: input → camera → morph → particles → debug. */
  addSystem(system: System): void {
    this.systems.push(system);
  }

  private resize = (): void => {
    const w = this.mount.clientWidth || window.innerWidth;
    const h = this.mount.clientHeight || window.innerHeight;
    const pr =
      Math.min(window.devicePixelRatio, this.quality.maxPixelRatio) * this.quality.renderScale;

    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize(pr);
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (now: number): void => {
      if (!this.running) return;
      requestAnimationFrame(loop);

      const raw = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      this.time.tick(raw);

      this.state.dt = this.time.delta;
      this.state.time = this.time.elapsed;
      this.state.frame++;

      for (const system of this.systems) system.update(this.time.delta);
      this.composer.render();
    };
    requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    for (const system of this.systems) system.dispose?.();
  }
}
