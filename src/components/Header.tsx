import { Sprout, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Header({ showLocation = false }: { showLocation?: boolean }) {
  const { t, location } = useApp();

  const locationText = [location.city, location.district, location.state]
    .filter(Boolean)
    .join(', ');

  return (
    <header className="glass-header sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-teal-700 flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold text-ink-900 leading-tight tracking-tight">SmartFarm <span className="gradient-text">AI</span></h1>
            <p className="text-xs text-ink-400 leading-tight truncate">{t('tagline')}</p>
          </div>
        </div>
        {showLocation && locationText && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-ink-500">
            <MapPin className="w-4 h-4 text-brand-700 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{locationText}</span>
          </div>
        )}
      </div>
    </header>
  );
}
