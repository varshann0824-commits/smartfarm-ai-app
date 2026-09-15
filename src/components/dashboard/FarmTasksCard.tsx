import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';
import { fetchFarmTasks, getTaskTypeLabel, type FarmTask } from '@/services/farmTaskService';
import { ProgressRing, StaggerItem } from '@/components/ui/motion';

const TASK_ICONS: Record<string, string> = {
  irrigation: '💧', fertilizer: '🌱', inspection: '🔍',
  pest_monitoring: '🐛', harvest: '🌾', other: '📋',
};

/**
 * Farm tasks card — progress visualization over the real Supabase tasks.
 * Read-only; all completion actions stay on the Farm Tasks page.
 */
export function FarmTasksCard({ index }: { index: number }) {
  const [tasks, setTasks] = useState<FarmTask[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFarmTasks()
      .then(data => { if (!cancelled) setTasks(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const list = tasks || [];
  const completed = list.filter(t => t.status === 'completed').length;
  const pending = list.filter(t => t.status === 'pending');
  const overdue = pending.filter(t => t.task_date < today);
  const next = [...pending].sort((a, b) => a.task_date.localeCompare(b.task_date))[0];
  const pct = list.length > 0 ? Math.round((completed / list.length) * 100) : 0;

  return (
    <StaggerItem index={index} className="h-full">
      <Link to="/farm-tasks" className="card-premium group h-full flex flex-col hover:-translate-y-0.5 transition-transform duration-300">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Farm Tasks</p>
          {overdue.length > 0 && <span className="badge badge-low">{overdue.length} OVERDUE</span>}
        </div>

        {error ? (
          <div className="flex-1 flex items-center py-6">
            <p className="text-sm text-ink-400">Couldn't load tasks. Check your connection — open Farm Tasks to retry.</p>
          </div>
        ) : tasks === null ? (
          <div className="flex items-center gap-4 mt-5 flex-1">
            <div className="w-20 h-20 rounded-full skeleton" />
            <div className="flex-1"><div className="w-28 h-4 skeleton mb-2" /><div className="w-20 h-3 skeleton" /></div>
          </div>
        ) : list.length === 0 ? (
          <div className="flex items-center gap-4 mt-5 flex-1">
            <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-5 h-5 text-ink-500" />
            </div>
            <p className="text-sm text-ink-500">No tasks yet. Plan irrigation, fertilizer & harvest reminders.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mt-4">
              <ProgressRing value={pct} size={78} strokeWidth={8}>
                <span className="font-display text-lg font-semibold text-ink-900">{pct}%</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">done</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-800">
                  {completed}/{list.length} tasks completed
                </p>
                {next ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 rounded-lg bg-stone-50 border border-stone-200/70 px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-ink-700 truncate">
                      {TASK_ICONS[next.task_type] || '📋'} {next.title}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      {getTaskTypeLabel(next.task_type)} ·{' '}
                      {next.task_date === today ? 'Today' : new Date(next.task_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-xs text-ink-400 mt-2 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> All pending tasks cleared
                  </p>
                )}
                {overdue.length > 0 && (
                  <p className="text-[11px] text-red-600 font-medium mt-2 inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {overdue.length} task{overdue.length > 1 ? 's' : ''} past due
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs">
          <span className="text-ink-400">Irrigation · Fertilizer · Harvest</span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </StaggerItem>
  );
}
