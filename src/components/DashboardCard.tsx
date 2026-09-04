import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  accent?: 'green' | 'blue' | 'amber' | 'orange' | 'teal' | 'red' | 'purple' | 'stone';
}

const accentMap = {
  green: 'bg-green-50 border-green-200 hover:border-green-400 text-green-700',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700',
  amber: 'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-700',
  teal: 'bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-700',
  red: 'bg-red-50 border-red-200 hover:border-red-400 text-red-700',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-700',
  stone: 'bg-stone-50 border-stone-200 hover:border-stone-400 text-stone-700',
};

const iconBgMap = {
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  teal: 'bg-teal-600',
  red: 'bg-red-500',
  purple: 'bg-purple-600',
  stone: 'bg-stone-600',
};

export function DashboardCard({ to, icon, title, description, actionLabel, accent = 'green' }: DashboardCardProps) {
  return (
    <Link
      to={to}
      className={`card border-2 transition-all duration-200 hover:shadow-md ${accentMap[accent]} group`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl ${iconBgMap[accent]} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-800 text-base leading-tight">{title}</h3>
          <p className="text-sm text-stone-500 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
        {actionLabel}
        <span>→</span>
      </div>
    </Link>
  );
}
