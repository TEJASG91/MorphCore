/**
 * Live-tunable motion parameters. The dev tuning panel binds to this object; production
 * uses the defaults below. Workflow: tune by eye in the panel, hit "log values", then paste
 * the result back into defaultMotionConfig() so the shipping build uses your tuned feel.
 *
 * Systems read these every frame, so edits apply live.
 */
export interface MotionConfig {
  breathAmp: number; // scale-pulse magnitude          (FaceController)
  breathFreq: number; // breathing rate                  (IdleAnimator)
  driftAmp: number; // idle head-drift amplitude ×      (IdleAnimator)
  driftFreq: number; // idle head-drift frequency ×      (IdleAnimator)
  pointerSensitivity: number; // gaze weight                      (GazeSource)
  pointerSmoothing: number; // exponential smoothing rate       (PointerInput)
  yawLimit: number; // rad cap, head yaw                (FaceController)
  pitchLimit: number; // rad cap, head pitch              (FaceController)
  cameraParallax: number; // rad of pointer sway              (CameraController)
  floatAmount: number; // vertical bob from breath         (FaceController)
}

export function defaultMotionConfig(): MotionConfig {
  return {
    breathAmp: 0.02,
    breathFreq: 1.4,
    driftAmp: 1.0,
    driftFreq: 1.0,
    pointerSensitivity: 0.7,
    pointerSmoothing: 9,
    yawLimit: 0.18,
    pitchLimit: 0.14,
    cameraParallax: 0.05,
    floatAmount: 0.03,
  };
}
