import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, History as HistoryIcon, ScanSearch } from 'lucide-react';
import { StaggerItem } from '@/components/ui/motion';
import type { CropAnalysisRecord } from '@/services/analysisHistoryService';

/**
 * Analysis history card — clean timeline over the real crop_analyses records
 * with a subtle staggered entrance. Manage/delete stays on the History page.
 */
export function HistoryCard({ analyses, index }: { analyses: CropAnalysisRecord[]; index: number }) {
  const recent = analyses.slice(0, 4);

  return (
    <StaggerItem index={index}>
      <div className="card-premium">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-ink-400" />
            <p className="text-eyebrow">Analysis History</p>
          </div>
          {analyses.length > 0 && <span className="badge badge-info">{analyses.length} saved</span>}
        </div>

        {recent.length === 0 ? (
          <div className="flex items-center gap-4 py-4">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <ScanSearch className="w-5 h-5 text-ink-400" />
            </div>
            <p className="text-sm text-ink-400">No analyses yet. Crop health scans you run will appear here as a timeline.</p>
          </div>
        ) : (
          <ol className="relative ml-2 border-l-2 border-stone-100 space-y-4">
            {recent.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="pl-5 relative"
              >
                <span
                  className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                    i === 0 ? 'bg-brand-600' : 'bg-stone-300'
                  }`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">
                      {a.crop || 'Crop'} — {a.problem || 'analysis'}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {a.confidence ? `${a.confidence} confidence · ` : ''}
                      {new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        )}

        <Link to="/history" className="mt-4 flex items-center justify-between text-xs group border-t border-stone-100 pt-3">
          <span className="text-ink-400">Full history & records</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </StaggerItem>
  );
}
