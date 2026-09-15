import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Mic, CloudSun, MoreHorizontal } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function BottomNav() {
  const { t } = useApp();
  const location = useLocation();

  // Hide bottom nav on onboarding and welcome pages
  const hiddenRoutes = ['/', '/onboarding', '/farmer-details'];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const items = [
    { to: '/dashboard', icon: Home, label: t('home') },
    { to: '/market', icon: TrendingUp, label: t('market') },
    { to: '/talk', icon: Mic, label: t('talk') },
    { to: '/weather', icon: CloudSun, label: t('weather') },
    { to: '/more', icon: MoreHorizontal, label: t('more') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30 md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(18,23,20,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 ${
                isActive ? 'text-green-700' : 'text-stone-500'
              }`
            }
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
