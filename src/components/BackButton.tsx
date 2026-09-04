import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function BackButton({ fallback = '/dashboard' }: { fallback?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useApp();

  const handleBack = () => {
    if (window.history.length > 1 && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-stone-600 hover:text-green-700 font-medium text-sm touch-target transition-colors"
      aria-label={t('back')}
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{t('back')}</span>
    </button>
  );
}
