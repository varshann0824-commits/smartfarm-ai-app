import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ScanSearch, ArrowRight, Leaf } from 'lucide-react';
import { StaggerItem } from '@/components/ui/motion';
import type { CropAnalysisRecord } from '@/services/analysisHistoryService';

/**
 * Crop health card — real healthy-crop photography + scanning visual with
 * the last real analysis result from the existing Supabase crop_analyses
 * history. Tapping opens the scanner.
 */
export function CropHealthCard({ lastAnalysis, loading, index }: { lastAnalysis: CropAnalysisRecord | null; loading: boolean; index: number }) {
  const isHealthy = !!lastAnalysis && /no (major )?(disease|problem|issue)|healthy/i.test(lastAnalysis.problem || '');

  return (
    <StaggerItem index={index} className="h-full">
      <Link to="/crop-health" className="card-premium group h-full flex flex-col hover:-translate-y-0.5 transition-transform duration-300">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Crop Health</p>
          {lastAnalysis && (
            <span className={`badge ${isHealthy ? 'badge-live' : 'badge-ai'}`}>{isHealthy ? 'HEALTHY' : 'LAST REPORT'}</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-4 mt-5 flex-1">
            <div className="w-14 h-14 rounded-xl skeleton" />
            <div className="flex-1"><div className="w-28 h-4 skeleton mb-2" /><div className="w-20 h-3 skeleton" /></div>
          </div>
        ) : lastAnalysis ? (
          <>
            {/* Scanner-style visual over real healthy crop photography */}
            <div className="relative mt-4 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-emerald-950">
              <img
                src={`${import.meta.env.BASE_URL}assets/cinematic/seedling.jpg`}
                alt=""
                draggable={false}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-emerald-950/45" aria-hidden="true" />
              <Leaf className="relative w-9 h-9 text-emerald-200/90" />
              <motion.div
                aria-hidden="true"
                className="absolute inset-x-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #34d399, transparent)', boxShadow: '0 0 12px #34d399' }}
                animate={{ top: ['12%', '86%', '12%'] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="absolute inset-2 border border-emerald-300/20 rounded-lg" aria-hidden="true" />
              <span className="absolute bottom-1.5 right-2 text-[9px] font-mono uppercase tracking-widest text-emerald-300/60">
                {lastAnalysis.crop || 'crop'} · analyzed
              </span>
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-ink-800 leading-snug line-clamp-1">{lastAnalysis.problem || 'Analysis complete'}</p>
              <p className="text-xs text-ink-400 mt-1">
                {lastAnalysis.crop || 'Crop'} · {lastAnalysis.confidence ? `${lastAnalysis.confidence} confidence` : 'recorded'} ·{' '}
                {new Date(lastAnalysis.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 mt-5 flex-1">
            <div className="relative w-14 h-14 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
              <ScanSearch className="w-6 h-6 text-teal-700" />
              <motion.span
                className="absolute inset-0 rounded-xl border border-teal-400"
                animate={{ scale: [1, 1.18], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-800">Scan your crop</p>
              <p className="text-xs text-ink-400 mt-0.5">AI diagnosis for diseases & pests</p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs">
          <span className="text-ink-400">AI-assisted diagnosis</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
            {lastAnalysis ? 'Scan again' : 'Start scan'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </StaggerItem>
  );
}
