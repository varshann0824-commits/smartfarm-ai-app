import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ExternalLink, BadgeCheck, ArrowRight, Store } from 'lucide-react';
import { getSellCropRoutes, type SellCropRoute } from '@/services/sellCropService';
import { StaggerItem } from '@/components/ui/motion';

const ROUTE_ICONS: Record<string, React.ReactNode> = {
  itc: <Store className="w-4 h-4" />,
  enam: <BadgeCheck className="w-4 h-4" />,
  apmc: <Store className="w-4 h-4" />,
  fpo: <BadgeCheck className="w-4 h-4" />,
  procurement: <Store className="w-4 h-4" />,
  logistics: <Store className="w-4 h-4" />,
};

/**
 * Sell crop card — harvest produce photography band with professional
 * buyer/company cards from the existing verified route data. Official
 * links preserved exactly as the service defines them.
 */
export function SellCropCard({ index }: { index: number }) {
  const routes: SellCropRoute[] = getSellCropRoutes().slice(0, 2);

  return (
    <StaggerItem index={index} className="h-full">
      <div className="card-premium relative h-full flex flex-col overflow-hidden">
        {/* Sharp harvest photography — selling should feel like the mandi */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-20 overflow-hidden">
          <img
            src={`${import.meta.env.BASE_URL}assets/cinematic/harvest.jpg`}
            alt=""
            draggable={false}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-white/30 to-white" />
        </div>
        <div className="relative flex items-center justify-between">
          <p className="text-eyebrow">Sell Your Crop</p>
          <span className="badge badge-verified">VERIFIED ROUTES</span>
        </div>

        <div className="mt-3 space-y-2.5 flex-1">
          {routes.map((route, i) => (
            <motion.div
              key={route.routeType}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-stone-200/70 bg-gradient-to-br from-white to-stone-50/80 p-3 hover:shadow-card hover:border-brand-300 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  {ROUTE_ICONS[route.routeType] || <Store className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-800 truncate leading-tight">{route.title}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">{route.source}</p>
                </div>
              </div>
              <a
                href={route.officialLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {route.officialLinkLabel}
              </a>
            </motion.div>
          ))}
        </div>

        <Link to="/sell-crop" className="mt-auto pt-3 flex items-center justify-between text-xs group">
          <span className="text-ink-400">Mandi · e-NAM · FPO · Government</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
            All selling paths <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </StaggerItem>
  );
}
