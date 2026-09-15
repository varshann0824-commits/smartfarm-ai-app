import { motion } from 'framer-motion';
import { Sprout, SkipForward } from 'lucide-react';

/**
 * DOM layer above the photographic cinematic scene: Skip Intro button, a
 * subtle progress line and the branding. Text timing switches between the
 * full cinematic and the shortened (reduced-motion) version.
 */

export type IntroTiming = 'full' | 'short';

export function IntroOverlay({ timing, onSkip }: { timing: IntroTiming; onSkip: () => void }) {
  const brandDelay = timing === 'full' ? 10.9 : 0.35;
  const logoDelay = timing === 'full' ? 12.0 : 1.6;
  const progressDuration = timing === 'full' ? 13.0 : 6.3;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none" aria-hidden="false">
      {/* Skip Intro — always visible, always tappable */}
      <button
        onClick={onSkip}
        className="pointer-events-auto absolute top-3.5 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:bg-black/50 active:scale-95 touch-target"
        aria-label="Skip Intro"
      >
        <span>Skip Intro</span>
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Subtle progress line */}
      <motion.div
        className="absolute bottom-0.5 left-0 h-1 bg-white/60 rounded-r-full z-10"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: progressDuration, ease: 'linear' }}
      />

      {/* Branding — tagline first */}
      <motion.div
        className="absolute inset-x-0 bottom-24 text-center px-4"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: brandDelay, duration: 0.7, ease: 'easeOut' }}
      >
        <p className="text-lg md:text-xl font-medium tracking-wide text-amber-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
          Plant today. Grow tomorrow.
        </p>
      </motion.div>

      {/* Branding — logo */}
      <motion.div
        className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-1.5 px-4"
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: logoDelay, duration: 0.85, ease: 'easeOut' }}
      >
        <div className="rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-2.5 shadow-lg">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-lime-300 via-green-300 to-emerald-400 drop-shadow-[0_3px_14px_rgba(0,0,0,0.4)]">
          SMARTFARM AI
        </p>
        <p className="text-sm text-green-100/90 tracking-wide">Helping Indian farmers make better decisions.</p>
      </motion.div>
    </div>
  );
}