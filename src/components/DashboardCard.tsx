import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface DashboardCardProps {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  accent?: 'green' | 'blue' | 'amber' | 'orange' | 'teal' | 'red' | 'purple' | 'stone';
}

const accentMap = {
  green: { text: 'text-green-700', iconBg: 'bg-green-600', ring: 'group-hover:border-green-400' },
  blue: { text: 'text-blue-700', iconBg: 'bg-blue-600', ring: 'group-hover:border-blue-400' },
  amber: { text: 'text-amber-700', iconBg: 'bg-amber-500', ring: 'group-hover:border-amber-400' },
  orange: { text: 'text-orange-700', iconBg: 'bg-orange-500', ring: 'group-hover:border-orange-400' },
  teal: { text: 'text-teal-700', iconBg: 'bg-teal-600', ring: 'group-hover:border-teal-400' },
  red: { text: 'text-red-700', iconBg: 'bg-red-500', ring: 'group-hover:border-red-400' },
  purple: { text: 'text-purple-700', iconBg: 'bg-purple-600', ring: 'group-hover:border-purple-400' },
  stone: { text: 'text-ink-700', iconBg: 'bg-ink-600', ring: 'group-hover:border-ink-400' },
};

export function DashboardCard({ to, icon, title, description, actionLabel, accent = 'green' }: DashboardCardProps) {
  const a = accentMap[accent];
  return (
    <Link to={to} className="block group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className={`card-premium border ${a.ring} transition-colors duration-300`}
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl ${a.iconBg} flex items-center justify-center text-white flex-shrink-0 shadow-card`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-ink-900 text-base leading-tight">{title}</h3>
            <p className="text-sm text-ink-500 mt-0.5 leading-snug">{description}</p>
          </div>
        </div>
        <div className={`mt-3.5 text-sm font-semibold flex items-center gap-1 ${a.text} group-hover:gap-2.5 transition-all`}>
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>
    </Link>
  );
}
