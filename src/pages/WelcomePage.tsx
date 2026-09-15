import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sprout, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BackdropScene } from '@/components/ui/PageBackdrop';

export function WelcomePage() {
  const navigate = useNavigate();
  const { hasOnboarded, t } = useApp();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (hasOnboarded) {
      navigate('/dashboard');
    }
  }, [hasOnboarded, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#101a12]">
      {/* Sharp cinematic Indian harvest photography — never blurred, only a
          legibility gradient below so the Get Started actions stay readable */}
      <BackdropScene variant="sunrise-field" veil={0} />

      {/* Legibility overlay above the scene, below the content */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/55" aria-hidden="true" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Brand mark */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center shadow-[0_18px_44px_-12px_rgba(18,23,20,0.55),0_0_0_1px_rgba(255,255,255,0.25)] ring-2 ring-white/30">
            <Sprout className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-6 drop-shadow-[0_3px_16px_rgba(0,0,0,0.4)]">
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-lime-200 to-emerald-300">SMARTFARM AI</span>
          </h1>
          <p className="text-center text-lg text-white/90 mt-2 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
            AI for a stronger Indian agriculture
          </p>
          <p className="text-center text-sm text-white/60 mt-4 max-w-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {t('tagline')}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-9">
            <motion.button
              onClick={() => navigate('/onboarding')}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary touch-target w-full text-base !py-3.5 rounded-2xl bg-gradient-to-r from-green-700 to-teal-700 hover:from-green-800 hover:to-teal-800 shadow-[0_14px_30px_-10px_rgba(16,85,50,0.55)]"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileTap={{ scale: 0.97 }}
              className="touch-target w-full rounded-2xl border-2 border-white/45 bg-white/15 backdrop-blur-sm text-white font-semibold py-3.5 hover:bg-white/25 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 mr-2 inline-block" /> Go to Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* Subtle scroll / enticement */}
        <p className="text-[11px] text-white/45 mt-8 tracking-wide">
          Weather · Mandi Prices · Crop Health · Schemes · AI Voice Assistant
        </p>
      </div>
    </div>
  );
}
