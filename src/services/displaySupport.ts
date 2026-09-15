/**
 * Lightweight capability detection for the cinematic intro.
 * All results are cached so detection runs once per session.
 */

export type IntroQuality = 'high' | 'low';

let webglResult: boolean | null = null;

/** True when a WebGL context (v2 or v1) can be created in this browser. */
export function isWebGLAvailable(): boolean {
  if (webglResult !== null) return webglResult;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    webglResult = Boolean(gl);
  } catch {
    webglResult = false;
  }
  return webglResult;
}

let reducedMotionResult: boolean | null = null;

/** True when the user has requested reduced motion via OS/browser settings. */
export function prefersReducedMotion(): boolean {
  if (reducedMotionResult !== null) return reducedMotionResult;
  try {
    reducedMotionResult = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    reducedMotionResult = false;
  }
  return reducedMotionResult;
}

let mobileResult: boolean | null = null;

/** Conservative mobile/coarse-pointer detection used to simplify rendering. */
export function isMobileDevice(): boolean {
  if (mobileResult !== null) return mobileResult;
  try {
    mobileResult =
      window.innerWidth < 768 ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 900) ||
      window.matchMedia('(pointer: coarse)').matches;
  } catch {
    mobileResult = false;
  }
  return mobileResult;
}

/** Decide the render quality for the intro scene. */
export function getIntroQuality(): IntroQuality {
  if (isMobileDevice()) return 'low';
  try {
    // Very small/old devices get the low settings too.
    const cores = navigator.hardwareConcurrency || 4;
    if (cores <= 2) return 'low';
  } catch {
    // keep default
  }
  return 'high';
}

/** Whether the full 3D cinematic should run. */
export function shouldUse3DCinematic(): boolean {
  if (prefersReducedMotion()) return false;
  return isWebGLAvailable();
}