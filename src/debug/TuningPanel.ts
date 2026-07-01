import type { MotionConfig } from '../behavior/MotionConfig';

/**
 * Dev-only live motion tuner. lil-gui is imported *inside* this module, and this module is
 * itself dynamically imported only under import.meta.env.DEV — so neither it nor lil-gui
 * ships in the production bundle.
 */
export async function createTuningPanel(config: MotionConfig): Promise<void> {
  const { default: GUI } = await import('lil-gui');
  const gui = new GUI({ title: 'Motion — dev' });

  const breath = gui.addFolder('Breathing / float');
  breath.add(config, 'breathAmp', 0, 0.08, 0.001).name('breath amp (scale)');
  breath.add(config, 'breathFreq', 0.2, 3, 0.01).name('breath freq');
  breath.add(config, 'floatAmount', 0, 0.1, 0.001).name('float amount');

  const idle = gui.addFolder('Idle head drift');
  idle.add(config, 'driftAmp', 0, 2, 0.01).name('drift amp');
  idle.add(config, 'driftFreq', 0, 3, 0.01).name('drift freq');

  const pointer = gui.addFolder('Pointer / gaze');
  pointer.add(config, 'pointerSensitivity', 0, 1.5, 0.01).name('sensitivity');
  pointer.add(config, 'pointerSmoothing', 1, 20, 0.5).name('smoothing');

  const limits = gui.addFolder('Limits');
  limits.add(config, 'yawLimit', 0, 0.5, 0.005).name('yaw limit (rad)');
  limits.add(config, 'pitchLimit', 0, 0.5, 0.005).name('pitch limit (rad)');
  limits.add(config, 'cameraParallax', 0, 0.2, 0.005).name('camera parallax');

  gui
    .add({ log: () => console.log('MotionConfig =', JSON.stringify(config, null, 2)) }, 'log')
    .name('⤓ log values to console');
}
