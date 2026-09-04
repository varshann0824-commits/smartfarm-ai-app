import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function WelcomePage() {
  const navigate = useNavigate();
  const { hasOnboarded, t } = useApp();

  useEffect(() => {
    if (hasOnboarded) {
      navigate('/dashboard');
    }
  }, [hasOnboarded, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50 flex flex-col items-center justify-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-green-700 flex items-center justify-center mb-6 shadow-lg">
        <Sprout className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-stone-800 text-center mb-2">SmartFarm AI</h1>
      <p className="text-stone-600 text-center max-w-sm mb-8">{t('tagline')}</p>
      <button
        onClick={() => navigate('/onboarding')}
        className="btn btn-primary touch-target w-full max-w-xs text-base"
      >
        Get Started
      </button>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-outline touch-target w-full max-w-xs mt-3 text-base"
      >
        Skip to Dashboard
      </button>
    </div>
  );
}
