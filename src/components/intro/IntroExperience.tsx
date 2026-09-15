import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { INTRO_TIMELINE, SHORT_INTRO_DURATION, getCinematicPhase, type CinematicIntroPhase } from './choreography';
import { prefersReducedMotion } from '@/services/displaySupport';
import { markIntroPlayed } from '@/services/introSession';
import { IntroOverlay } from './IntroOverlay';
import { CinematicIntroScene } from './FallbackIntro';

/**
 * IntroExperience — full-screen cinematic intro.
 *
 * Realistic photographic opening experience (NOT procedural 3D):
 * planting → growth → harvest, built on sharp high-resolution Indian
 * farming photography with slow Ken Burns drift and letterbox framing.
 *
 * - Marks the session flag immediately (plays once per session).
 * - Zero WebGL/GPU cost — DOM/CSS only, always reliable.
 * - Reduced-motion users get the same sharp photography without drift.
 * - Calls `onComplete` after the timeline (or on Skip) so the parent gate
 *   can fade the overlay out and reveal the untouched application.
 */

export type IntroExperienceProps = {
  onComplete: () => void;
};

export function IntroExperience({ onComplete }: IntroExperienceProps) {
  const finished = useRef(false);
  const complete = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  const reduced = prefersReducedMotion();
  const duration = reduced ? SHORT_INTRO_DURATION : INTRO_TIMELINE.outEnd + 0.4;
  const timing: 'full' | 'short' = reduced ? 'short' : 'full';

  const [phase, setPhase] = useState<CinematicIntroPhase>('planting');
  const startRef = useRef<number>(0);

  useEffect(() => {
    markIntroPlayed();
    startRef.current = performance.now();
    const id = window.setTimeout(complete, Math.round((duration + 0.2) * 1000));

    // Drive the photographic shot clock.
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      // The shortened cut plays each shot proportionally faster.
      const scaled = reduced ? elapsed * (INTRO_TIMELINE.outEnd / SHORT_INTRO_DURATION) : elapsed;
      const next = getCinematicPhase(scaled);
      setPhase((prev) => (prev === next ? prev : next));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(id);
      window.cancelAnimationFrame(raf);
    };
  }, [complete, duration, reduced]);

  return (
    <motion.div
      className="smartfarm-intro fixed inset-0 z-[100] overflow-hidden bg-[#101a12]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      aria-label="SmartFarm AI cinematic intro"
    >
      <CinematicIntroScene reducedMotion={reduced} activePhase={phase} />
      <IntroOverlay timing={timing} onSkip={complete} />
    </motion.div>
  );
}