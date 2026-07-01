// The morph happens entirely on the GPU. `position` is each particle's START; we mix()
// toward `aTarget` by an eased, per-particle-delayed progress so the cloud "assembles"
// in a wave rather than snapping. Soft additive points give the glow.
//
// Inlined as strings to keep M1 dependency-free; swap to vite-plugin-glsl later if wanted.

export const PARTICLE_VERT = /* glsl */ `
  uniform float uMorphT;   // 0..1 global morph progress
  uniform float uTime;     // seconds
  uniform float uSize;     // base point size (folds in pixel ratio)
  uniform float uMotion;   // 0 disables the idle shimmer (reduced-motion)

  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aDelay;  // staggers each particle's arrival

  varying vec3 vColor;
  varying float vProg;

  float easeOut(float t){ return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    float local = clamp((uMorphT - aDelay) / max(0.0001, 1.0 - aDelay), 0.0, 1.0);
    float e = easeOut(local);

    vec3 pos = mix(position, aTarget, e);
    pos.y += sin(uTime * 0.7 + position.x * 3.0) * 0.012 * e * uMotion;

    vColor = aColor;
    vProg = e;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = clamp(aSize * uSize * (300.0 / -mv.z), 1.0, 14.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const PARTICLE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vProg;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d); // soft round dot
    if (a <= 0.001) discard;
    gl_FragColor = vec4(vColor, a * (0.35 + 0.65 * vProg));
  }
`;
