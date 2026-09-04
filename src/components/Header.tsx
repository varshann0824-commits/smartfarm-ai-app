import { Sprout } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Header({ showLocation = false }: { showLocation?: boolean }) {
  const { t, location } = useApp();

  const locationText = [location.city, location.district, location.state]
    .filter(Boolean)
    .join(', ');

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center flex-shrink-0">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-stone-800 leading-tight">SmartFarm AI</h1>
            <p className="text-xs text-stone-500 leading-tight truncate">{t('tagline')}</p>
          </div>
        </div>
        {showLocation && locationText && (
          <div className="flex items-center gap-1 mt-2 text-sm text-stone-600">
            <span className="text-base">📍</span>
            <span className="truncate">{locationText}</span>
          </div>
        )}
      </div>
    </header>
  );
}
