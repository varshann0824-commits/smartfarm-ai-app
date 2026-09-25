import { motion } from 'framer-motion';
import { Activity, ArrowRight, Bug, Droplets, Leaf, RadioTower, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const indicators = [
  { label: 'Crop Status', icon: Leaf },
  { label: 'Pest Risk', icon: Bug },
  { label: 'Water Stress', icon: Droplets },
  { label: 'Environmental Risk', icon: TriangleAlert },
];

/** Primary dashboard entry for the continuous field-monitoring command center. */
export function CropMonitoringCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-3xl border-2 border-lime-300/50 shadow-hero"
    >
      <Link
        to="/crop-monitoring"
        aria-label="Open Crop Monitoring"
        className="group relative block min-h-[300px] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-200 sm:p-7"
      >
        <img
          src={`${import.meta.env.BASE_URL}assets/cinematic/field.jpg`}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a12]/95 via-[#0c2a1b]/85 to-[#14532d]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a12]/95 via-transparent to-transparent" />

        <div className="relative flex h-full min-h-[260px] flex-col text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-200/30 bg-lime-300/15 text-lime-200 shadow-card">
                <Activity className="h-6 w-6" />
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-200/25 bg-lime-200/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lime-100">
                  <RadioTower className="h-3 w-3" /> Core field system
                </span>
                <h2 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Crop Monitoring</h2>
                <p className="text-sm font-semibold text-lime-100">AI-powered field monitoring</p>
              </div>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85">Field command center</span>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Monitor crop conditions, environmental risks, irrigation needs, pest activity, and field-level risks in one place.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:max-w-2xl sm:grid-cols-4">
            {indicators.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <Icon className="h-4 w-4 flex-shrink-0 text-lime-200" />
                <span className="text-xs font-semibold text-white/90">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
            <div className="max-w-lg text-[11px] leading-relaxed text-white/55">
              <span className="font-semibold text-white/75">Current web app:</span> weather, saved observations, and farmer-entered records. Soil probes, field cameras, and on-device AI are shown as future integration—not fabricated readings.
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-emerald-950 shadow-lg transition-transform group-hover:translate-x-0.5">
              Open Crop Monitoring <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.section>
  );
}
