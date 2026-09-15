import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { StaggerItem } from '@/components/ui/motion';
import type { WeatherWarning } from '@/types';
import { WARNING_LEVELS } from '@/services/disasterAlertService';

/**
 * Safety card — severe-weather photography when alerts are active so the
 * emergency state is visually prominent. Driven by the warnings the
 * existing weather/disaster-alert services compute. All clear when none.
 */
export function SafetyCard({ warnings, loading, index }: { warnings: WeatherWarning[]; loading: boolean; index: number }) {
  const hasAlerts = warnings.length > 0;
  const top = warnings[0];
  const level = top ? WARNING_LEVELS[top.level as keyof typeof WARNING_LEVELS] : null;

  return (
    <StaggerItem index={index} className="h-full">
      <Link
        to="/safety"
        className={`card-premium group h-full flex flex-col hover:-translate-y-0.5 transition-transform duration-300 relative overflow-hidden ${
          hasAlerts ? 'border-red-200' : ''
        }`}
      >
        {hasAlerts && (
          <>
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: 'linear-gradient(90deg, #dc2626, #f97316)' }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            {/* Sharp storm photography — disaster state must feel severe */}
            <div aria-hidden="true" className="absolute inset-x-0 top-1 h-20 overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}assets/cinematic/storm.jpg`}
                alt=""
                draggable={false}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-white/30 to-white" />
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Safety & Alerts</p>
          {hasAlerts ? (
            <span className="badge badge-low">{warnings.length} ACTIVE</span>
          ) : (
            <span className="badge badge-live">ALL CLEAR</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-4 mt-5 flex-1">
            <Loader2 className="w-10 h-10 text-ink-300 animate-spin-slow" />
            <div className="flex-1"><div className="w-32 h-4 skeleton mb-2" /><div className="w-24 h-3 skeleton" /></div>
          </div>
        ) : hasAlerts && level ? (
          <div className="flex items-start gap-3 mt-5 flex-1">
            <div className={`w-11 h-11 rounded-xl ${level.color} flex items-center justify-center flex-shrink-0 shadow-card`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900 leading-snug">{top.title}</p>
              <p className="text-xs text-ink-500 mt-1 line-clamp-2 leading-relaxed">{top.actions[0]}</p>
              {warnings.length > 1 && (
                <p className="text-xs text-red-600 font-medium mt-2">+{warnings.length - 1} more alert{warnings.length > 2 ? 's' : ''}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 mt-5 flex-1">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-800">No severe weather alerts</p>
              <p className="text-xs text-ink-400 mt-0.5">Conditions are normal for your area</p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs">
          <span className="text-ink-400">{hasAlerts ? 'Tap for safety actions' : 'Official IMD warnings'}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
            Safety center <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </StaggerItem>
  );
}
