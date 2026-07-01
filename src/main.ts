import './style.css';
import * as THREE from 'three';
import { detectQuality, QUALITY_PRESETS } from './core/QualityTiers';
import { createRuntimeState } from './core/runtimeState';
import { TimeController } from './core/TimeController';
import { RenderCore } from './core/RenderCore';
import { CameraController } from './core/CameraController';
import { ParticleSystem } from './particles/ParticleSystem';
import { MorphEngine } from './morph/MorphEngine';
import { ImageTargetProvider } from './providers/ImageTargetProvider';
import { makeDefaultFace } from './providers/defaultFace';
import { DebugOverlay } from './debug/DebugOverlay';
import { PointerInput } from './input/PointerInput';
import { IdleAnimator } from './behavior/IdleAnimator';
import { GazeSource } from './behavior/GazeSource';
import { ExpressionMixer } from './behavior/ExpressionMixer';
import { FaceController } from './behavior/FaceController';
import { defaultMotionConfig } from './behavior/MotionConfig';

async function boot(): Promise<void> {
  // 1) Quality decides N once, for the whole session.
  const quality = QUALITY_PRESETS[detectQuality()];
  const state = createRuntimeState(quality.tier, quality.particleCount);
  const time = new TimeController(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const motion = defaultMotionConfig();

  // 2) Scene graph + core systems.
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  const mount = document.getElementById('app')!;

  const render = new RenderCore(state, quality, time, scene, camera, mount);

  const particles = new ParticleSystem(state);
  scene.add(particles.points);
  particles.setPointPixelRatio(render.renderer.getPixelRatio());
  particles.setMotionEnabled(!time.reducedMotion);
  render.onResize = (pr) => particles.setPointPixelRatio(pr);

  const morph = new MorphEngine(particles, state);
  if (time.reducedMotion) {
    morph.setAutoAdvance(false);
    state.morphT = 1;
  }

  // 3) M2 — living face: pointer + idle signals → mixer → FaceController → points transform.
  const pointer = new PointerInput(state, render.renderer.domElement, motion);
  const mixer = new ExpressionMixer();
  mixer.add(new IdleAnimator(motion));
  mixer.add(new GazeSource(motion));
  const face = new FaceController(state, mixer, particles.points, time, motion);
  const cameraCtrl = new CameraController(camera, state, time.reducedMotion, motion);

  // 4) Register systems in update order (pointer → face → morph → camera → particles → debug).
  render.addSystem(pointer);
  render.addSystem(face);
  render.addSystem(morph);
  render.addSystem(cameraCtrl);
  render.addSystem(particles);
  if (import.meta.env.DEV) {
    render.addSystem(new DebugOverlay(state, render.renderer, camera, time));
  }
  render.start();

  // 5) Content: a placeholder face (replace by uploading your own photo).
  await morph.setProvider(
    new ImageTargetProvider(makeDefaultFace(), 'face', { color: 'spectrum' }),
  );
  if (time.reducedMotion) state.morphT = 1;

  const file = document.getElementById('file') as HTMLInputElement | null;
  file?.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      void morph.setProvider(new ImageTargetProvider(img, 'face', { color: 'spectrum' }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  });

  // Dev: live motion tuning panel + time controls (none of this ships in production).
  if (import.meta.env.DEV) {
    void import('./debug/TuningPanel').then(({ createTuningPanel }) => createTuningPanel(motion));
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        time.togglePause();
      } else if (e.key === ']') time.setSpeed(Math.min(4, time.currentSpeed + 0.25));
      else if (e.key === '[') time.setSpeed(Math.max(0, time.currentSpeed - 0.25));
    });
  }
}

void boot();
