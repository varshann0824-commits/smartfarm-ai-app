import { motion, useReducedMotion } from 'framer-motion';

export type WeatherVisualType = 'sun' | 'partly' | 'cloud' | 'rain' | 'thunder' | 'fog' | 'snow';

/** Maps a free-text weather condition string to a visual type. */
export function conditionType(condition: string | null | undefined): WeatherVisualType {
  const c = (condition || '').toLowerCase();
  if (/thunder|storm|lightning/.test(c)) return 'thunder';
  if (/rain|drizzle|shower/.test(c)) return 'rain';
  if (/snow|sleet|hail/.test(c)) return 'snow';
  if (/fog|mist|haze/.test(c)) return 'fog';
  if (/clear|sunny|hot/.test(c)) return 'sun';
  if (/partly|few/.test(c)) return 'partly';
  if (/cloud|overcast/.test(c)) return 'cloud';
  return 'partly';
}

/**
 * Animated SVG weather icon — CSS/motion only, tiny footprint.
 * Uses the real condition text from the existing weather service.
 */
export function AnimatedWeatherIcon({ type, size = 72, color = '#f59e0b' }: { type: WeatherVisualType; size?: number; color?: string }) {
  const reduce = useReducedMotion();
  const drop = (x: number, delay: number) => (
    <motion.path
      key={x}
      d={`M${x} 40 L${x - 2.4} 47 a2.6 2.6 0 1 0 4.8 0 Z`}
      fill="#38bdf8"
      animate={reduce ? undefined : { y: [0, 12], opacity: [1, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeIn', delay }}
    />
  );

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {(type === 'sun' || type === 'partly') && (
        <motion.g
          style={{ originX: '32px', originY: '26px' }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={32 + Math.cos(a) * 12}
                y1={26 + Math.sin(a) * 12}
                x2={32 + Math.cos(a) * 17}
                y2={26 + Math.sin(a) * 17}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
        </motion.g>
      )}
      {(type === 'sun' || type === 'partly') && (
        <motion.circle
          cx={32}
          cy={26}
          r={type === 'sun' ? 9.5 : 7.5}
          fill={color}
          animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '32px', originY: '26px' }}
        />
      )}
      {type !== 'sun' && type !== 'fog' && (
        <motion.g
          animate={reduce ? undefined : { x: [-1.6, 1.6, -1.6] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M22 42 a9 9 0 0 1 1.8 -17.8 a11 11 0 0 1 21 -1.4 a8 8 0 0 1 3 15.4 q-1.6 1 -3.2 1.4 Z"
            transform="translate(0, 4)"
            fill={type === 'thunder' ? '#64748b' : '#94a3b8'}
          />
          <path
            d="M22 42 a9 9 0 0 1 1.8 -17.8 a11 11 0 0 1 21 -1.4 a8 8 0 0 1 3 15.4 q-1.6 1 -3.2 1.4 Z"
            transform="translate(0, 4) scale(0.82)"
            fill="#e2e8f0"
            opacity={0.9}
          />
        </motion.g>
      )}
      {(type === 'rain' || type === 'thunder') && (
        <g>{[24, 31, 38].map((x, i) => drop(x, i * 0.22))}</g>
      )}
      {type === 'thunder' && (
        <motion.path
          d="M33 44 L28 53 L32.5 53 L30 60 L38 49 L33.5 49 L36 44 Z"
          fill="#fbbf24"
          animate={reduce ? undefined : { opacity: [1, 0.25, 1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
      {type === 'snow' && (
        <g>
          {[25, 32, 39].map((x, i) => (
            <motion.circle
              key={x}
              cx={x}
              cy={46}
              r={2.2}
              fill="#bae6fd"
              animate={reduce ? undefined : { y: [0, 12], opacity: [1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeIn', delay: i * 0.35 }}
            />
          ))}
        </g>
      )}
      {type === 'fog' && (
        <g>
          {[0, 1, 2].map(i => (
            <motion.line
              key={i}
              x1={14 + (i % 2) * 4}
              y1={44 + i * 7}
              x2={50 - (i % 2) * 6}
              y2={44 + i * 7}
              stroke="#94a3b8"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.75}
              animate={reduce ? undefined : { x: i % 2 ? [3, -3, 3] : [-3, 3, -3] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
