import { motion, AnimatePresence } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Cinematic photographic page backdrops                               */
/*                                                                     */
/* Presentation-only. Renders sharp, high-resolution realistic Indian  */
/* farming photography behind each feature (weather sky, produce,      */
/* storm, foliage, harvest, sunrise...) with readability overlays.     */
/* No procedural 3D, no geometric characters, no blurred backgrounds.  */
/*                                                                     */
/* Performance: still photographic <img> layers + transform/opacity    */
/* Ken Burns drift only. `prefers-reduced-motion` disables drift       */
/* (see index.css), and each scene is a single image node per page.    */
/* ------------------------------------------------------------------ */

const CINEMATIC_BASE = `${import.meta.env.BASE_URL}assets/cinematic`;

export type BackdropVariant =
  | 'farm'            // sunrise green farm — default
  | 'field'           // bright green field (crop recommendation)
  | 'talk'            // green farm + subtle futuristic AI elements
  | 'weather'         // blue sky, clouds, sunlight
  | 'market'          // golden mandi / produce dusk
  | 'crop-health'     // close-up healthy crop foliage
  | 'safety'          // dramatic storm / rain atmosphere
  | 'soil'            // realistic soil & farmland
  | 'schemes'         // professional agri-support daylight
  | 'support'         // warm farmer community environment
  | 'sell-crop'       // harvest produce market
  | 'settings'        // calm, simple agricultural landscape
  | 'sunrise-field'   // cinematic sunrise field (welcome)
  | 'blue-sky-field'; // bright farming landscape (language picker)

/** Routes that draw their own background and opt out of the switcher. */
const SELF_BACKED: string[] = ['/', '/onboarding'];

/* ------------------------------------------------------------------ */
/* Photographic variant map — sharp realistic Indian farming imagery   */
/* ------------------------------------------------------------------ */

type PhotoTone = 'light' | 'dark';

const VARIANTS: Record<BackdropVariant, { src: string; alt: string; tone: PhotoTone }> = {
  farm: { src: 'field.jpg', alt: 'Lush green Indian farm field', tone: 'light' },
  field: { src: 'meadow.jpg', alt: 'Vibrant green crop field', tone: 'light' },
  talk: { src: 'field.jpg', alt: 'Green farm field with bright sky', tone: 'light' },
  weather: { src: 'sky.jpg', alt: 'Dramatic monsoon sky with clouds', tone: 'light' },
  market: { src: 'produce.jpg', alt: 'Fresh harvested agricultural produce', tone: 'light' },
  'crop-health': { src: 'seedling.jpg', alt: 'Healthy young green crop seedling', tone: 'light' },
  safety: { src: 'storm.jpg', alt: 'Severe storm clouds over farmland', tone: 'dark' },
  soil: { src: 'planting.jpg', alt: 'Farmer hands planting in rich soil', tone: 'light' },
  schemes: { src: 'meadow.jpg', alt: 'Thriving green farmland', tone: 'light' },
  support: { src: 'harvest.jpg', alt: 'Farmers harvesting golden crops', tone: 'light' },
  'sell-crop': { src: 'harvest.jpg', alt: 'Golden harvest ready for market', tone: 'light' },
  settings: { src: 'meadow.jpg', alt: 'Calm green agricultural landscape', tone: 'light' },
  'sunrise-field': { src: 'harvest.jpg', alt: 'Indian farm at golden sunrise', tone: 'dark' },
  'blue-sky-field': { src: 'field.jpg', alt: 'Green field under bright blue sky', tone: 'light' },
};

const ROUTE_VARIANTS: Record<string, BackdropVariant> = {
  '/dashboard': 'farm',
  '/talk': 'talk',
  '/weather': 'weather',
  '/market': 'market',
  '/crop-health': 'crop-health',
  '/safety': 'safety',
  '/soil': 'soil',
  '/schemes': 'schemes',
  '/support': 'support',
  '/sell-crop': 'sell-crop',
  '/settings': 'settings',
  '/more': 'farm',
  '/crop-recommendation': 'field',
  '/farm-tasks': 'farm',
  '/history': 'farm',
  '/profit': 'market',
  '/farmer-details': 'farm',
};

export function getBackdropVariant(pathname: string): BackdropVariant | null {
  if (SELF_BACKED.includes(pathname)) return null;
  return ROUTE_VARIANTS[pathname] || 'farm';
}

/**
 * Persistent switcher — lives for the whole app session so route changes
 * crossfade from one environment to the next (one continuous application).
 */
export function BackdropSwitcher() {
  const location = useLocation();
  const variant = getBackdropVariant(location.pathname);
  const veil = location.pathname === '/talk' ? 0.62 : 0.32;
  if (variant === null) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <AnimatePresence mode="sync" presenceAffectsLayout={false}>
        <motion.div
          key={variant}
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <BackdropScene variant={variant} veil={veil} />
          {/* top & bottom soft shading keeps headings/footers readable */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-stone-50/0 to-stone-50/55" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50/0 to-stone-50/45" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function Sky(palette: { top: string; mid: string; bottom: string }) {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[62%]"
      style={{ background: `linear-gradient(180deg, ${palette.top} 0%, ${palette.mid} 58%, ${palette.bottom} 100%)` }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Cinematic Ken Burns drift for still photography. Transform/opacity  */
/* only; the global prefers-reduced-motion override disables it.       */
/* ------------------------------------------------------------------ */

function PhotoDrift({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <style>{`
        @keyframes bkd-kenburns { from { transform: scale(1.02); } to { transform: scale(1.12) translate(-1.2%, -1%); } }
      `}</style>
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className="absolute inset-0 h-full w-full object-cover bkd-kenburns"
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.9s ease',
          animation: 'bkd-kenburns 26s ease-in-out infinite alternate',
        }}
      />
    </>
  );
}

/* --- Legacy procedural primitives (retained unused) ------------------ */

function LegacySun({ color, glow, left = '68%', top = '30%', size = 88, pulse = true }: { color: string; glow: string; left?: string; top?: string; size?: number; pulse?: boolean }) {
  return (
    <div
      className={`absolute rounded-full ${pulse ? 'bkd-pulse' : ''}`}
      style={{
        left, top, width: size, height: size,
        background: `radial-gradient(circle at 42% 40%, ${color} 0%, ${color} 58%, rgba(255,255,255,0) 78%)`,
        boxShadow: `0 0 26px ${glow}, 0 0 64px ${glow}`,
        transformOrigin: '50% 50%',
      }}
    />
  );
}

function Clouds({ hue = '#ffffff', topMin = 6, topMax = 26, count = 4, fast = false }: { hue?: string; topMin?: number; topMax?: number; count?: number; fast?: boolean }) {
  const items: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const top = topMin + ((i * 97) % Math.max(1, topMax - topMin));
    const w = 64 + ((i * 53) % 150);
    items.push(
      <div
        key={i}
        className={`absolute ${fast ? 'bkd-cloud-fast' : 'bkd-cloud'}`}
        style={{
          top: `${top}%`,
          width: w,
          height: 7 + (i % 3) * 3,
          background: hue,
          filter: 'blur(4px)',
          opacity: 0.32 + (i % 3) * 0.16,
          animationDelay: `-${i * 11}s`,
          animationDuration: `${36 + i * 14 - (fast ? 16 : 0)}s`,
        }}
      />,
    );
  }
  return <>{items}</>;
}

function Hills({ fill, bottom = '24%', blur = 0, flip = false }: { fill: string; bottom?: string; blur?: number; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 800 130"
      preserveAspectRatio="none"
      className="absolute left-0 w-full pointer-events-none"
      style={{ bottom, height: 190, filter: blur ? `blur(${blur}px)` : undefined }}
    >
      {flip ? (
        <>
          <path d="M800 104 Q 640 64 480 84 T 120 88 L0 92 L0 130 L800 130 Z" fill={fill} opacity="0.9" />
          <path d="M800 118 Q 620 92 420 108 T 90 106 L0 110 L0 130 L800 130 Z" fill={fill} />
        </>
      ) : (
        <>
          <path d="M0 102 Q 160 62 320 84 T 680 80 T 800 88 L800 130 L0 130 Z" fill={fill} opacity="0.9" />
          <path d="M0 118 Q 180 88 380 102 T 700 96 L800 130 L0 130 Z" fill={fill} />
        </>
      )}
    </svg>
  );
}

function FieldRows({ rows, top = '34%' }: { rows: string[]; top?: string }) {
  const stops = rows.map((c, i) => `${c} ${i * 8}%`).join(', ');
  const parallel = rows.map((c, i) => `${c} ${(i + 1) * 8}%`).join(', ');
  return (
    <>
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          height: `${100 - parseFloat(top)}%`,
          background: `repeating-linear-gradient(180deg, ${stops}, ${parallel})`,
        }}
      />
      {/* subtle furrow glare */}
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-white/10" />
    </>
  );
}

function Fireflies({ count = 7, hue = 'rgba(255,235,150,0.9)' }: { count?: number; hue?: string }) {
  const flies: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    flies.push(
      <span
        key={i}
        className="absolute w-1 h-1 rounded-full bkd-firefly"
        style={{ left: `${6 + ((i * 41) % 88)}%`, bottom: `${4 + ((i * 23) % 26)}%`, background: hue, animationDelay: `-${i * 1.7}s`, animationDuration: `${7 + (i % 4) * 1.6}s` }}
      />,
    );
  }
  return <>{flies}</>;
}

function AIGlow() {
  return (
    <>
      {[
        ['22%', '18%', '#34d399'],
        ['72%', '24%', '#0e7490'],
        ['48%', '40%', '#d97706'],
      ].map(([left, top, color], i) => (
        <span
          key={i}
          className="absolute w-10 h-10 rounded-full bkd-pulse"
          style={{ left, top, background: color, opacity: 0.16, boxShadow: `0 0 22px ${color}`, animationDelay: `-${i * 1.8}s`, animationDuration: `${4 + i * 1.4}s` }}
        />
      ))}
      <span
        className="absolute h-0.5 w-1/2 bkd-scan"
        style={{ top: '30%', background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)', boxShadow: '0 0 10px rgba(52,211,153,0.35)' }}
      />
    </>
  );
}

function StormClouds() {
  const bands: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    bands.push(
      <div
        key={i}
        className="absolute bkd-cloud-fast"
        style={{
          top: `${3 + i * 6}%`,
          left: `${(i * 29) % 70}%`,
          width: 190 + (i % 3) * 90,
          height: 26 + (i % 2) * 12,
          background: '#3a3f4d',
          filter: 'blur(7px)',
          opacity: 0.5 + (i % 3) * 0.12,
          borderRadius: 40,
          animationDelay: `-${i * 7}s`,
          animationDuration: `${44 - i * 3}s`,
        }}
      />,
    );
  }
  return <>{bands}</>;
}

function Rain() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[84%] bkd-rain"
      style={{
        backgroundImage:
          'repeating-linear-gradient(6deg, rgba(200,215,235,0.32) 0 1px, transparent 0 26px)',
        maskImage: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.9) 0 40px, rgba(0,0,0,0) 0 90px)',
      }}
    />
  );
}

function Lightning() {
  return (
    <div
      className="absolute inset-0 bkd-lightning"
      style={{
        background: 'radial-gradient(circle at 30% 12%, rgba(210,225,255,0.55) 0%, rgba(190,205,240,0.22) 30%, transparent 60%)',
      }}
    />
  );
}

function Leaves() {
  const makeLeaf = (left: string, bottom: string, rot: number, scale: number, opacity = 0.9): ReactNode => (
    <svg viewBox="0 0 60 60" className="absolute" style={{ left, bottom, transform: `rotate(${rot}deg) scale(${scale})`, opacity }} aria-hidden="true">
      <ellipse cx="30" cy="30" rx="22" ry="10" fill="url(#leafGrad)" transform="rotate(-24 30 30)" />
      <path d="M14 32 L46 24" stroke="#1c4a2a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );

  return (
    <>
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <radialGradient id="leafGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#7dbf5e" />
            <stop offset="70%" stopColor="#3e8c42" />
            <stop offset="100%" stopColor="#2a6430" />
          </radialGradient>
        </defs>
      </svg>
      {makeLeaf('4%', '6%', -18, 2.4, 0.5)}
      {makeLeaf('16%', '28%', 22, 1.6, 0.6)}
      {makeLeaf('28%', '4%', -8, 2.8, 0.85)}
      {makeLeaf('42%', '34%', 16, 1.3, 0.6)}
      {makeLeaf('58%', '6%', -32, 2.5, 0.8)}
      {makeLeaf('72%', '30%', 8, 1.8, 0.6)}
      {makeLeaf('86%', '6%', -14, 2.3, 0.75)}
      {makeLeaf('94%', '34%', 24, 1.2, 0.5)}
      {['12% 70%', '34% 60%', '52% 88%', '64% 84%', '80% 58%', '24% 90%'].map((pos, i) => {
        const [left, top] = pos.split(' ');
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${left}%`, top, width: 12 + (i % 3) * 14, height: 12 + (i % 3) * 14, background: `radial-gradient(circle, ${i % 2 ? 'rgba(214,255,200,0.5)' : 'rgba(140,220,120,0.4)'} 0%, transparent 70%)` }}
          />
        );
      })}
    </>
  );
}

function MarketStands() {
  return (
    <svg viewBox="0 0 800 150" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full" aria-hidden="true">
      <g fill="#241510">
        <path d="M40 150 L120 62 L200 150 Z" />
        <path d="M210 150 L300 70 L400 150 Z" />
        <path d="M430 150 L540 58 L660 150 Z" />
        <path d="M680 150 L760 74 L800 138 Z" />
      </g>
      <g stroke="#241510" strokeWidth="3">
        <line x1="120" y1="62" x2="120" y2="150" />
        <line x1="300" y1="70" x2="300" y2="150" />
        <line x1="540" y1="58" x2="540" y2="150" />
        <line x1="760" y1="74" x2="760" y2="150" />
      </g>
      <g>
        <ellipse cx="150" cy="130" rx="26" ry="10" fill="#d94b2b" />
        <ellipse cx="345" cy="128" rx="24" ry="9" fill="#f2b23c" />
        <ellipse cx="566" cy="126" rx="28" ry="10" fill="#3e8c42" />
        <ellipse cx="712" cy="132" rx="22" ry="8" fill="#f2b23c" />
      </g>
      {[[110, 40], [292, 48], [532, 36], [752, 50]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill="#ffca5e" opacity="0.85">
          <animate attributeName="opacity" values="0.55;1;0.55" dur={`${3 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function Farmhouse() {
  return (
    <svg viewBox="0 0 220 110" className="absolute right-[14%] bottom-[20%] w-36 opacity-85" aria-hidden="true">
      <polygon points="30,96 78,46 126,96" fill="#8a5a3a" />
      <rect x="40" y="62" width="76" height="34" fill="#caa67b" />
      <rect x="50" y="40" width="56" height="14" fill="#7a4a2b" />
      <rect x="48" y="52" width="10" height="10" fill="#ffd980" />
      <rect x="98" y="52" width="10" height="10" fill="#ffd980" />
      <rect x="70" y="74" width="12" height="16" fill="#5c3a20" />
    </svg>
  );
}

function Wheat() {
  const stalks: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const x = (i * 31) % 90;
    const h = 26 + (i % 5) * 10;
    stalks.push(
      <span
        key={i}
        className="absolute bkd-sway"
        style={{ left: `${x}%`, bottom: `${8 + (i % 3) * 3}%`, width: 2, height: h, background: '#caa23b', transformOrigin: '50% 100%', borderRadius: 4, animationDelay: `-${(i % 6) * 0.6}s` }}
      />,
    );
  }
  return <>{stalks}</>;
}

function SoilRows() {
  const rows: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    rows.push(
      <span key={i} className="absolute rounded-full" style={{ left: `${(i * 13) % 92}%`, bottom: `${(i * 7) % 30}%`, width: 3 + (i % 3), height: 3 + (i % 3), background: i % 2 ? 'rgba(217,181,140,0.4)' : 'rgba(60,32,14,0.45)' }} />,
    );
  }
  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 h-[46%]"
        style={{ backgroundImage: 'repeating-linear-gradient(180deg, #6f451f 0 14px, #89532e 14px 26px, #7c4a27 26px 40px, #8a5a33 40px 52px)' }}
      />
      {rows}
      {[6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94].map((left, i) => (
        <span key={i} className="absolute rounded-full" style={{ left: `${left}%`, bottom: '42%', width: 5, height: 10, background: '#3e8c42', transformOrigin: '50% 100%', animation: `bkd-sway 6s ease-in-out infinite`, animationDelay: `-${i * 0.5}s` }} />
      ))}
    </>
  );
}

function TricolorBand() {
  return (
    <div
      className="absolute inset-x-0 top-[46%] h-1 opacity-70"
      style={{ background: 'linear-gradient(90deg, #ff8f3d 0%, #ffffff 50%, #1d8a3f 100%)' }}
    />
  );
}

function Scene(props: { sky: { top: string; mid: string; bottom: string }; cloudHue: string; hillFar: string; hillNear: string; fieldRows: string[]; sun?: Parameters<typeof LegacySun>[0] }) {
  return (
    <>
      <Sky {...props.sky} />
      {props.sun && <LegacySun {...props.sun} />}
      <Clouds hue={props.cloudHue} count={8} />
      <Hills fill={props.hillFar} bottom="30%" blur={1} flip />
      <Hills fill={props.hillNear} bottom="21%" />
      <FieldRows rows={props.fieldRows} top="34%" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Public scene renderer + variant composer                            */
/* ------------------------------------------------------------------ */

export function BackdropScene({ variant, veil = 0.32, className = '' }: { variant: BackdropVariant; veil?: number; className?: string }) {
  const photo = VARIANTS[variant] ?? VARIANTS.farm;
  const clamped = Math.max(0, Math.min(1, veil));
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`.trim()} aria-hidden="true">
      <PhotoDrift src={`${CINEMATIC_BASE}/${photo.src}`} alt={photo.alt} />
      {/* Readability via subtle overlays only — photography never blurred. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(248,250,247,0.5) 0%, rgba(248,250,247,0.12) 26%, rgba(10,18,12,0) 62%, rgba(10,18,12,0.34) 100%)',
        }}
      />
      {clamped > 0 && <div className="absolute inset-0 bg-[#f7f5ef]" style={{ opacity: clamped }} />}
      {photo.tone === 'dark' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/45" />
      )}
    </div>
  );
}
