// Quality tiers are *initialization presets*, not runtime effects.
// The particle count N is chosen once here at startup and NEVER changes during runtime —
// because per-particle morph correspondence depends on a stable buffer. Switching tiers
// means a reload, not a live resize.

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface QualityConfig {
  tier: QualityTier;
  /** N — fixed for the whole session. */
  particleCount: number;
  /** multiplier applied on top of devicePixelRatio. */
  renderScale: number;
  /** reserved for the M4 bloom pass. */
  bloomResolutionScale: number;
  maxPixelRatio: number;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityConfig> = {
  low: {
    tier: 'low',
    particleCount: 20_000,
    renderScale: 0.75,
    bloomResolutionScale: 0.5,
    maxPixelRatio: 1.5,
  },
  medium: {
    tier: 'medium',
    particleCount: 50_000,
    renderScale: 1.0,
    bloomResolutionScale: 0.5,
    maxPixelRatio: 2,
  },
  high: {
    tier: 'high',
    particleCount: 100_000,
    renderScale: 1.0,
    bloomResolutionScale: 0.75,
    maxPixelRatio: 2,
  },
  ultra: {
    tier: 'ultra',
    particleCount: 150_000,
    renderScale: 1.0,
    bloomResolutionScale: 1.0,
    maxPixelRatio: 2,
  },
};

/**
 * Pick a sensible default tier from device hints.
 * Override at any time with ?quality=low|medium|high|ultra in the URL.
 */
export function detectQuality(): QualityTier {
  if (typeof navigator === 'undefined') return 'high';

  const forced = new URLSearchParams(location.search).get('quality') as QualityTier | null;
  if (forced && forced in QUALITY_PRESETS) return forced;

  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;

  if (mobile) return cores >= 6 ? 'medium' : 'low';
  if (cores >= 8 && mem >= 8) return 'ultra';
  if (cores >= 4) return 'high';
  return 'medium';
}
