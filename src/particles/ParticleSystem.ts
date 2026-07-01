import * as THREE from 'three';
import type { RuntimeState } from '../core/runtimeState';
import type { TargetData } from '../morph/types';
import type { System } from '../core/System';
import { PARTICLE_VERT, PARTICLE_FRAG } from './shaders';

/**
 * The single, reusable particle buffer. Holds a FIXED N of particles for the whole
 * session. A "scene" is just a set of `aTarget`/`aColor`/`aSize` values; the GPU
 * interpolates each particle from its start to its target by `uMorphT`. Particles beyond
 * a scene's `count` are parked at size 0 (transparent) — never created or destroyed.
 *
 * This is the contract every later milestone reuses unchanged.
 */
export class ParticleSystem implements System {
  readonly points: THREE.Points;

  private readonly N: number;
  private readonly material: THREE.ShaderMaterial;
  private readonly start: THREE.BufferAttribute;
  private readonly target: THREE.BufferAttribute;
  private readonly color: THREE.BufferAttribute;
  private readonly size: THREE.BufferAttribute;

  constructor(private state: RuntimeState) {
    this.N = state.particleCount;
    const N = this.N;

    const start = new Float32Array(N * 3);
    const target = new Float32Array(N * 3);
    const color = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const delay = new Float32Array(N);

    // Initial "dust cloud": random points in a sphere. start AND target begin here, so
    // nothing moves until the first setTargets() call.
    const R = 3.7;
    for (let i = 0; i < N; i++) {
      const r = R * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(ph) * Math.cos(th);
      const y = r * Math.sin(ph) * Math.sin(th);
      const z = r * Math.cos(ph);
      start[i * 3] = target[i * 3] = x;
      start[i * 3 + 1] = target[i * 3 + 1] = y;
      start[i * 3 + 2] = target[i * 3 + 2] = z;
      color[i * 3] = 0.4;
      color[i * 3 + 1] = 0.5;
      color[i * 3 + 2] = 1.0;
      size[i] = 0; // hidden until a scene assigns it
      delay[i] = 0.5 * Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    this.start = new THREE.BufferAttribute(start, 3);
    this.target = new THREE.BufferAttribute(target, 3);
    this.color = new THREE.BufferAttribute(color, 3);
    this.size = new THREE.BufferAttribute(size, 1);
    geometry.setAttribute('position', this.start); // "position" == morph START
    geometry.setAttribute('aTarget', this.target);
    geometry.setAttribute('aColor', this.color);
    geometry.setAttribute('aSize', this.size);
    geometry.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMorphT: { value: 1 },
        uTime: { value: 0 },
        uSize: { value: 0.05 },
        uMotion: { value: 1 },
      },
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  /**
   * Assign a new scene target. The current target becomes the new start, so the next
   * morph flows from wherever the particles currently sit. (Caller resets morphT to 0.)
   */
  setTargets(data: TargetData): void {
    const N = this.N;
    const startArr = this.start.array as Float32Array;
    const targetArr = this.target.array as Float32Array;
    const colorArr = this.color.array as Float32Array;
    const sizeArr = this.size.array as Float32Array;

    // 1) freeze the current target as the new start
    startArr.set(targetArr);

    // 2) write the new target; park unused particles at size 0
    const count = Math.min(data.count, N);
    for (let i = 0; i < count; i++) {
      targetArr[i * 3] = data.positions[i * 3];
      targetArr[i * 3 + 1] = data.positions[i * 3 + 1];
      targetArr[i * 3 + 2] = data.positions[i * 3 + 2];
      colorArr[i * 3] = data.colors[i * 3];
      colorArr[i * 3 + 1] = data.colors[i * 3 + 1];
      colorArr[i * 3 + 2] = data.colors[i * 3 + 2];
      sizeArr[i] = data.sizes[i];
    }
    for (let i = count; i < N; i++) {
      targetArr[i * 3] = startArr[i * 3];
      targetArr[i * 3 + 1] = startArr[i * 3 + 1];
      targetArr[i * 3 + 2] = startArr[i * 3 + 2];
      sizeArr[i] = 0;
    }

    this.start.needsUpdate = true;
    this.target.needsUpdate = true;
    this.color.needsUpdate = true;
    this.size.needsUpdate = true;
  }

  /** Per-frame uniform sync. Progress and time come from the runtime state. */
  update(): void {
    this.material.uniforms.uMorphT.value = this.state.morphT;
    this.material.uniforms.uTime.value = this.state.time;
  }

  setPointPixelRatio(pr: number): void {
    this.material.uniforms.uSize.value = 0.05 * pr;
  }

  setMotionEnabled(on: boolean): void {
    this.material.uniforms.uMotion.value = on ? 1 : 0;
  }
}
