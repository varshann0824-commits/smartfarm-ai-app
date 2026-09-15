import { motion, useReducedMotion } from 'framer-motion';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const STATE_LABEL: Record<VoiceState, string> = {
  idle: 'Ready',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

/**
 * Premium voice orb visualization. Pure framer-motion (no canvas) so it stays
 * cheap everywhere. Driven entirely by the existing STT/TTS pipeline state.
 */
export function VoiceOrb({
  state,
  size = 132,
  onClick,
  disabled,
  title,
}: {
  state: VoiceState;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const active = state !== 'idle';
  const accent = state === 'listening' ? '#f97316' : state === 'thinking' ? '#0e7490' : '#15803d';

  return (
    <div className={`flex flex-col items-center gap-3 ${onClick ? '' : 'pointer-events-none'}`}>
      {onClick ? (
        <motion.button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={title || 'Talk to SmartFarm AI'}
          className="relative flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-600/40 disabled:opacity-60"
          style={{ width: size, height: size }}
          whileTap={{ scale: 0.94 }}
          whileHover={disabled ? undefined : { scale: 1.03 }}
        >
          <OrbRings accent={accent} active={active} reduce={!!reduce} />
          <CoreDisc size={size} accent={accent} state={state} reduce={!!reduce} />
          <span className="relative z-10 flex items-center justify-center" style={{ width: size * 0.56, height: size * 0.56 }}>
            {state === 'thinking' ? <ThinkingOrbit size={size} reduce={!!reduce} /> : <WaveBars size={size} state={state} accent={accent} reduce={!!reduce} />}
          </span>
        </motion.button>
      ) : (
        <div
          role="img"
          aria-label={title || 'Talk to SmartFarm AI'}
          className="relative flex items-center justify-center rounded-full"
          style={{ width: size, height: size }}
        >
          <OrbRings accent={accent} active={active} reduce={!!reduce} />
          <CoreDisc size={size} accent={accent} state={state} reduce={!!reduce} />
          <span className="relative z-10 flex items-center justify-center" style={{ width: size * 0.56, height: size * 0.56 }}>
            {state === 'thinking' ? <ThinkingOrbit size={size} reduce={!!reduce} /> : <WaveBars size={size} state={state} accent={accent} reduce={!!reduce} />}
          </span>
        </div>
      )}

      {/* State chip */}
      <motion.div
        key={state}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: `${accent}14`, color: accent }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: accent }}
          animate={reduce || state === 'idle' ? undefined : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        {STATE_LABEL[state]}
      </motion.div>
    </div>
  );
}

function OrbRings({ accent, active, reduce }: { accent: string; active: boolean; reduce: boolean }) {
  if (!active && reduce) return null;
  return (
    <>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ border: `1.5px solid ${accent}44` }}
        animate={reduce ? undefined : { scale: [1, 1.28], opacity: [0.55, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ border: `1.5px solid ${accent}33` }}
        animate={reduce ? undefined : { scale: [1, 1.28], opacity: [0.4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 1.1 }}
      />
    </>
  );
}

function CoreDisc({ size, accent, state, reduce }: { size: number; accent: string; state: VoiceState; reduce: boolean }) {
  return (
    <motion.span
      className="absolute rounded-full"
      style={{
        inset: size * 0.06,
        background: `radial-gradient(circle at 32% 28%, ${accent}26 0%, #ffffff00 58%), linear-gradient(145deg, #ffffff, #f0fdf4)`,
        boxShadow: `0 10px 34px -12px ${accent}66, inset 0 0 0 1px rgba(28,41,33,0.07)`,
      }}
      animate={reduce ? undefined : { scale: state === 'idle' ? [1, 1.035, 1] : 1 }}
      transition={{ duration: 4, repeat: state === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
    />
  );
}

function ThinkingOrbit({ size, reduce }: { size: number; reduce: boolean }) {
  const colors = ['#15803d', '#0f766e', '#d97706'];
  return (
    <motion.span
      className="relative block w-full h-full"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
    >
      {colors.map((bg, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: size * 0.075,
            height: size * 0.075,
            background: bg,
            top: '50%',
            left: '50%',
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={
            reduce
              ? { x: Math.cos((i * 2 * Math.PI) / 3) * size * 0.24, y: Math.sin((i * 2 * Math.PI) / 3) * size * 0.24 }
              : {
                  x: [Math.cos((i * 2 * Math.PI) / 3) * size * 0.24, Math.cos(((i + 1) * 2 * Math.PI) / 3) * size * 0.24],
                  y: [Math.sin((i * 2 * Math.PI) / 3) * size * 0.24, Math.sin(((i + 1) * 2 * Math.PI) / 3) * size * 0.24],
                }
          }
          transition={{ duration: 1.3, repeat: reduce ? 0 : Infinity, ease: 'linear' }}
        />
      ))}
    </motion.span>
  );
}

function WaveBars({ size, state, accent, reduce }: { size: number; state: VoiceState; accent: string; reduce: boolean }) {
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <span className="flex items-center justify-center gap-[3px] h-full">
      {bars.map(i => {
        const center = Math.abs(i - 3);
        const base = 0.18 + (3 - center) * 0.11;
        return (
          <motion.span
            key={i}
            className="rounded-full"
            style={{ width: Math.max(3, size * 0.032), background: accent, height: '20%' }}
            animate={
              reduce
                ? { height: `${base * 100}%` }
                : state === 'speaking'
                  ? { height: [`${base * 90}%`, `${Math.min(96, base * 210)}%`, `${base * 110}%`] }
                  : state === 'listening'
                    ? { height: [`${base * 120}%`, `${base * 60}%`, `${base * 170}%`] }
                    : { height: `${base * 90}%` }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    duration: state === 'speaking' ? 0.55 : state === 'listening' ? 0.75 : 1.6,
                    repeat: state === 'speaking' || state === 'listening' ? Infinity : 0,
                    repeatType: 'mirror',
                    delay: i * (state === 'speaking' ? 0.07 : 0.1),
                    ease: 'easeInOut',
                  }
            }
          />
        );
      })}
    </span>
  );
}
