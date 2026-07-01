import type * as THREE from 'three';
import type { RuntimeState } from '../core/runtimeState';
import type { TimeController } from '../core/TimeController';
import type { System } from '../core/System';

/**
 * Always-on dev readout. Toggle with the backtick (`) key. Reads only cheap, real metrics
 * — deep profiling (Spector.js, Chrome GPU profiler) stays an on-demand activity.
 *
 * Metrics that depend on systems which don't exist yet (loaded assets, active plugins)
 * are intentionally omitted; they arrive with the AssetManager and any first real system.
 */
export class DebugOverlay implements System {
  private el: HTMLDivElement;
  private acc = 0;
  private frames = 0;
  private fps = 0;
  private frameMs = 0;
  private visible = true;

  constructor(
    private state: RuntimeState,
    private renderer: THREE.WebGLRenderer,
    private camera: THREE.PerspectiveCamera,
    private time: TimeController,
  ) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: '9999',
      font: '11px/1.55 ui-monospace, monospace',
      color: '#9ad',
      background: 'rgba(8,10,20,.62)',
      border: '1px solid rgba(120,130,230,.3)',
      borderRadius: '8px',
      padding: '8px 12px',
      pointerEvents: 'none',
      whiteSpace: 'pre',
      backdropFilter: 'blur(6px)',
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(this.el);

    window.addEventListener('keydown', (e) => {
      if (e.key === '`') {
        this.visible = !this.visible;
        this.el.style.display = this.visible ? 'block' : 'none';
      }
    });
  }

  update(dt: number): void {
    this.acc += dt;
    this.frames++;
    if (this.acc >= 0.5) {
      this.fps = Math.round(this.frames / this.acc);
      this.frameMs = (this.acc / this.frames) * 1000;
      this.acc = 0;
      this.frames = 0;
    }
    if (!this.visible) return;

    const s = this.state;
    const dom = this.renderer.domElement;
    const calls = this.renderer.info.render.calls;
    const p = this.camera.position;
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const memTxt = mem ? `${(mem.usedJSHeapSize / 1048576).toFixed(0)} MB` : '—';
    const clock = this.time.isPaused ? 'paused' : `▶ ${this.time.currentSpeed.toFixed(2)}×`;

    this.el.textContent =
      `fps        ${this.fps}  (${this.frameMs.toFixed(1)} ms)\n` +
      `tier       ${s.quality}\n` +
      `particles  ${s.particleCount.toLocaleString()}\n` +
      `scene      ${s.scene}\n` +
      `morphT     ${s.morphT.toFixed(3)}\n` +
      `pointer    ${s.pointer.x.toFixed(2)}, ${s.pointer.y.toFixed(2)}\n` +
      `head       ${s.expression.headYaw.toFixed(2)}, ${s.expression.headPitch.toFixed(2)}\n` +
      `draw calls ${calls}\n` +
      `resolution ${dom.width}×${dom.height}\n` +
      `camera     ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\n` +
      `js heap    ${memTxt}\n` +
      `clock      ${clock}`;
  }
}
