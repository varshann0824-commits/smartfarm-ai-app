import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from './Header';

interface PageWrapperProps {
  title?: string;
  children: ReactNode;
  showHeader?: boolean;
  showLocation?: boolean;
  showBackButton?: boolean;
  fallback?: string;
}

export function PageWrapper({
  title,
  children,
  showHeader = true,
  showLocation = true,
  showBackButton = true,
  fallback = '/dashboard',
}: PageWrapperProps) {
  const { t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 1 && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-nav md:pb-0">
      {showHeader && <Header showLocation={showLocation} />}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          {showBackButton ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-stone-600 hover:text-green-700 font-medium text-sm touch-target transition-colors"
                aria-label={t('back')}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('back')}</span>
              </button>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-stone-600 hover:text-green-700 font-medium text-sm touch-target transition-colors"
            aria-label={t('home')}
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">{t('home')}</span>
          </button>
        </div>
        {title && <h2 className="text-xl font-bold text-stone-800 mb-4">{title}</h2>}
        <div className="animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
