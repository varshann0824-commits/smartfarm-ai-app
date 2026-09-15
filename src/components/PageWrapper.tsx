import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
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

const PAGE_TRANSITION = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

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
    <div className="min-h-screen relative pb-nav md:pb-0">
      {showHeader && <Header showLocation={showLocation} />}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          {showBackButton ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700 font-medium text-sm touch-target transition-colors"
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
            className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700 font-medium text-sm touch-target transition-colors"
            aria-label={t('home')}
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">{t('home')}</span>
          </button>
        </div>
        {title && <h2 className="section-title text-xl mb-4">{title}</h2>}
        {/* Page transition — subtle fade + rise on every route change */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={PAGE_TRANSITION}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
