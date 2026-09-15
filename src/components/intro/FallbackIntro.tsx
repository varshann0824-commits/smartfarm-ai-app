import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * CinematicIntroScene — realistic photographic opening experience.
 *
 * A three-shot cinematic sequence built on sharp, high-resolution real
 * Indian farming photography (NEVER blurred — only subtle legibility
 * gradients):
 *
 *   1. PLANTING  — farmer/child planting a seed (planting.jpg)
 *   2. GROWTH    — beautiful natural growth transition (seedling.jpg)
 *   3. HARVEST   — healthy mature field/tree (field.jpg)
 *
 * Slow Ken Burns drift + crossfades give the cinematic motion; captions
 * narrate the seed-to-harvest story. Works with zero GPU cost, respects
 * `prefers-reduced-motion` (static frames, no drift), and never blocks the
 * app — the parent gate always fades this overlay out on schedule.
 */

export type CinematicPhase = 'planting' | 'growth' | 'harvest';

const SHOTS: { key: CinematicPhase; src: string; alt: string; caption: string; sub: string; kenBurns: string }[] = [
  {
    key: 'planting',
    src: `${import.meta.env.BASE_URL}assets/cinematic/planting.jpg`,
    alt: 'Farmer planting a seedling in rich Indian soil at sunrise',
    caption: 'Every harvest begins with a single seed',
    sub: 'A farmer plants with care and hope',
    kenBurns: 'cinematic-drift-a',
  },
  {
    key: 'growth',
    src: `${import.meta.env.BASE_URL}assets/cinematic/seedling.jpg`,
    alt: 'Young green seedling growing through natural soil',
    caption: 'Nurtured by soil, sun and rain',
    sub: 'The seed grows into a healthy plant',
    kenBurns: 'cinematic-drift-b',
  },
  {
    key: 'harvest',
    src: `${import.meta.env.BASE_URL}assets/cinematic/field.jpg`,
    alt: 'Healthy mature green crop field under bright sky',
    caption: 'Grown into a thriving harvest',
    sub: 'SmartFarm AI walks with you at every step',
    kenBurns: 'cinematic-drift-c',
  },
];

/** Preload the sequence so no frame ever pops in blank. */
function preloadShots() {
  try {
    for (const shot of SHOTS) {
      const img = new Image();
      img.decoding = 'async';
      img.src = shot.src;
    }
  } catch {
    // Preload is best-effort only.
  }
}

export function CinematicIntroScene({
  reducedMotion,
  activePhase,
}: {
  reducedMotion: boolean;
  activePhase: CinematicPhase;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    preloadShots();
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#101a12]">
      <style>{`
        @keyframes cinematic-drift-a { from { transform: scale(1.02); } to { transform: scale(1.13) translate(-1.5%, -1%); } }
        @keyframes cinematic-drift-b { from { transform: scale(1.13) translate(1.5%, 1%); } to { transform: scale(1.03); } }
        @keyframes cinematic-drift-c { from { transform: scale(1.04); } to { transform: scale(1.14) translate(1%, -1.5%); } }
      `}</style>

      {SHOTS.map((shot) => {
        const active = ready && activePhase === shot.key;
        return (
          <div key={shot.key} className="absolute inset-0" aria-hidden={active ? 'false' : 'true'}>
            <img
              src={shot.src}
              alt={shot.alt}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={
                reducedMotion
                  ? { opacity: active ? 1 : 0 }
                  : {
                      opacity: active ? 1 : 0,
                      transition: 'opacity 1.6s ease-in-out',
                      animation: active ? `${shot.kenBurns} 6.5s ease-out forwards` : undefined,
                    }
              }
            />
          </div>
        );
      })}

      {/* Letterbox bars — the cinematic frame. Only the bars darken; the
          photography itself stays sharp and unblurred. */}
      <div className="absolute inset-x-0 top-0 h-[7vh] bg-black/85" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-[7vh] bg-black/85" aria-hidden="true" />

      {/* Subtle legibility gradients — top/bottom only, never a full blur. */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,10,8,0.42) 0%, rgba(6,10,8,0) 22%, rgba(6,10,8,0) 62%, rgba(6,10,8,0.5) 100%)',
        }}
      />

      {/* Captions narrating the seed-to-harvest story. */}
      <div className="absolute inset-x-0 bottom-[16%] px-6 text-center" aria-hidden="true">
        {SHOTS.map((shot) => {
          const active = ready && activePhase === shot.key;
          if (!active) return null;
          return (
            <motion.div
              key={shot.key}
              className="mx-auto max-w-xl"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.9, ease: 'easeOut' }}
            >
              <p className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-[0_3px_16px_rgba(0,0,0,0.55)]">
                {shot.caption}
              </p>
              <p className="mt-2 text-sm sm:text-base text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {shot.sub}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
