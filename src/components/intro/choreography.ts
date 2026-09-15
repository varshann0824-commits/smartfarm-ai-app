/**
 * Shared timeline for the SmartFarm AI cinematic intro.
 *
 * The intro is a realistic photographic sequence (planting → growth →
 * harvest) rendered with DOM/CSS only — no procedural 3D, no geometric
 * characters. These helpers keep the phase clock, caption timing and
 * overlay in sync.
 */

export const INTRO_TIMELINE = {
  /** Total runtime of the photographic cinematic (seconds). */
  end: 13.6,
  /** Shot 1 — farmer/child planting a seed. */
  plantStart: 0.05,
  plantEnd: 4.4,
  /** Shot 2 — natural growth transition into a healthy plant. */
  growStart: 4.4,
  growEnd: 9.3,
  /** Shot 3 — thriving harvest + camera-style push feel. */
  harvestStart: 9.3,
  harvestEnd: 11.4,
  /** Branding fade-in. */
  brandStart: 10.9,
  brandOut: 12.5,
  /** Everything fades away to reveal the existing app. */
  outEnd: 13.2,
  // --- Legacy aliases (kept so older imports keep compiling) ---
  /** @deprecated use plantStart */
  walkStart: 0.05,
  /** @deprecated use plantEnd */
  walkEnd: 2.45,
  /** @deprecated use plantStart */
  digStart: 2.45,
  /** @deprecated use plantEnd */
  digEnd: 3.6,
  /** @deprecated use plantStart */
  planting: 0,
  /** @deprecated unused */
  waterStart: 4.4,
  /** @deprecated unused */
  waterEnd: 6.0,
  /** @deprecated use growStart */
  cameraStart: 9.3,
  /** @deprecated use harvestEnd */
  cameraEnd: 11.4,
} as const;

/** Duration of the shortened (reduced-motion) intro. */
export const SHORT_INTRO_DURATION = 6.5;

export type CinematicIntroPhase = 'planting' | 'growth' | 'harvest';

/** Map elapsed seconds to the active photographic shot. */
export function getCinematicPhase(t: number): CinematicIntroPhase {
  if (t < INTRO_TIMELINE.growStart) return 'planting';
  if (t < INTRO_TIMELINE.harvestStart) return 'growth';
  return 'harvest';
}

export type IntroPhase = {
  /** Global elapsed time (s). */
  t: number;
  /** 0..1 progress of each scene block (legacy fields kept for compat). */
  walk: number;
  digging: number;
  planting: number;
  watering: number;
  growing: number;
  cameraPush: number;
  brand: number;
  done: boolean;
  /** Active photographic shot. */
  shot: CinematicIntroPhase;
};

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Normalised 0..1 with smooth easing between two times. */
export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Compute the current phase from the intro clock (photographic shots). */
export function getIntroPhase(t: number): IntroPhase {
  return {
    t,
    walk: smoothstep(INTRO_TIMELINE.walkStart, INTRO_TIMELINE.walkEnd, t),
    digging: smoothstep(INTRO_TIMELINE.digStart, INTRO_TIMELINE.digEnd, t),
    planting: smoothstep(INTRO_TIMELINE.plantStart, INTRO_TIMELINE.plantEnd, t),
    watering: smoothstep(INTRO_TIMELINE.waterStart, INTRO_TIMELINE.waterEnd, t),
    growing: smoothstep(INTRO_TIMELINE.growStart, INTRO_TIMELINE.growEnd, t),
    cameraPush: smoothstep(INTRO_TIMELINE.cameraStart, INTRO_TIMELINE.cameraEnd, t),
    brand: smoothstep(INTRO_TIMELINE.brandStart, INTRO_TIMELINE.brandOut, t),
    done: t >= INTRO_TIMELINE.end,
    shot: getCinematicPhase(t),
  };
}

/** Five growth stages driven by the 0..1 growth progress. */
export function getGrowthStage(growth: number): {
  stage: number;
  local: number;
} {
  const stage = Math.min(4, Math.floor(clamp(growth, 0, 1) * 5));
  const local = clamp(growth * 5 - stage, 0, 1);
  return { stage, local };
}