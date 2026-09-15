import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useInView, animate, useReducedMotion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/* Staggered entrance primitives                                       */
/* ------------------------------------------------------------------ */

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function StaggerItem({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeUp} initial="hidden" animate="show" custom={index}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Animated number counter                                             */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  duration = 1.1,
}: {
  value: number | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    if (value === null || !Number.isFinite(value)) {
      node.textContent = '—';
      return;
    }
    if (started.current) {
      // Value updated after first render — animate from current displayed value
      const from = parseFloat(node.textContent?.replace(/[^0-9.-]/g, '') || '0') || 0;
      const controls = animate(from, value, {
        duration: 0.6,
        ease: 'easeOut',
        onUpdate: v => { node.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`; },
      });
      return () => controls.stop();
    }
    started.current = true;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => { node.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`; },
    });
    return () => controls.stop();
  }, [inView, value, decimals, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {value === null || !Number.isFinite(value) ? '—' : `${prefix}${(0).toFixed(decimals)}${suffix}`}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Animated sparkline (real data series)                               */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values,
  width = 120,
  height = 36,
  stroke = '#16a34a',
  fill = 'rgba(22,163,74,0.12)',
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const stepX = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${(width - pad).toFixed(1)},${height} L${pad},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <path d={areaPath} fill={fill} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      <circle
        cx={pad + (values.length - 1) * stepX}
        cy={pad + (1 - (values[values.length - 1] - min) / span) * (height - pad * 2)}
        r={2.5}
        fill={stroke}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Animated circular progress ring                                     */
/* ------------------------------------------------------------------ */

export function ProgressRing({
  value,
  size = 72,
  strokeWidth = 7,
  color = '#16a34a',
  track = '#e7e9e7',
  children,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={`relative inline-flex items-center justify-center ${className || ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mini progress bar                                                   */
/* ------------------------------------------------------------------ */

export function ProgressBar({ value, color = '#16a34a', className }: { value: number; color?: string; className?: string }) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full rounded-full bg-ink-100 overflow-hidden ${className || ''}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        initial={reduce ? { width: `${clamped}%` } : { width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
