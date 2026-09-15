import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CloudRain, CloudSun, Leaf, Mic, Sprout, Sun, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageWrapper } from '@/components/PageWrapper';
import { DashboardCard } from '@/components/DashboardCard';
import { DemoBanner } from '@/components/DataBadges';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { MarketCard } from '@/components/dashboard/MarketCard';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { CropHealthCard } from '@/components/dashboard/CropHealthCard';
import { SellCropCard } from '@/components/dashboard/SellCropCard';
import { SafetyCard } from '@/components/dashboard/SafetyCard';
import { FarmTasksCard } from '@/components/dashboard/FarmTasksCard';
import { HistoryCard } from '@/components/dashboard/HistoryCard';
import { VoiceOrb } from '@/components/voice/VoiceOrb';
import { fetchWeather, type WeatherResult } from '@/services/weatherService';
import { fetchCropAnalyses, type CropAnalysisRecord } from '@/services/analysisHistoryService';

/** Quick actions shown inside the Talk to SmartFarm AI hero. */
const QUICK_ACTIONS: { label: string; to: string }[] = [
  { label: 'Check market prices', to: '/market' },
  { label: 'What should I plant?', to: '/crop-recommendation' },
  { label: 'Is rain expected?', to: '/weather' },
  { label: 'Government schemes', to: '/schemes' },
  { label: 'Disaster alerts', to: '/safety' },
];

export function DashboardPage() {
  const { t, location, demoMode, farmerDetails, detectLocation } = useApp();
  const navigate = useNavigate();

  // Same weather service call as before — kept as the full result so the
  // safety card can render the warnings the service already computes.
  const [weatherResult, setWeatherResult] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Auto-detect location on dashboard load if we don't have valid GPS
  // coordinates. This fixes stale localStorage data persisting across
  // sessions and the app showing a location different from the user's
  // actual current location.
  useEffect(() => {
    if (!location.latitude || !location.longitude) {
      detectLocation();
   }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.latitude && location.longitude) {
      setWeatherLoading(true);
      fetchWeather(location.latitude, location.longitude)
        .then(r => setWeatherResult(r))
        .finally(() => setWeatherLoading(false));
    }
  }, [location.latitude, location.longitude]);

  // Real analysis history (Supabase) shared by the health & history cards
  const [analyses, setAnalyses] = useState<CropAnalysisRecord[] | null>(null);
  useEffect(() => {
    fetchCropAnalyses()
      .then(setAnalyses)
      .catch(() => setAnalyses([]));
  }, []);

  const weather = weatherResult?.current ?? null;

  return (
    <PageWrapper showBackButton={false}>
      {demoMode && <div className="mb-4"><DemoBanner /></div>}

      <div className="space-y-4">
        <DashboardHero weather={weather} loading={weatherLoading} />
        <DashboardBody
          weather={weather}
          weatherLoading={weatherLoading}
          warnings={weatherResult?.warnings ?? []}
          analyses={analyses}
          talkTitle={t('talkToAI')}
          tapToSpeak={t('tapToSpeak')}
          typeInstead={t('typeInstead')}
          moreLabel={t('more')}
          farmerDetails={farmerDetails}
          onTalk={() => navigate('/talk')}
        />
      </div>
    </PageWrapper>
  );
}

interface DashboardBodyProps {
  weather: WeatherResult['current'];
  weatherLoading: boolean;
  warnings: WeatherResult['warnings'];
  analyses: CropAnalysisRecord[] | null;
  talkTitle: string;
  tapToSpeak: string;
  typeInstead: string;
  moreLabel: string;
  farmerDetails: ReturnType<typeof useApp>['farmerDetails'];
  onTalk: () => void;
}

function DashboardBody({
  weather, weatherLoading, warnings, analyses,
  talkTitle, tapToSpeak, typeInstead, moreLabel, farmerDetails, onTalk,
}: DashboardBodyProps) {
  return (
    <>
      {/* Voice-first CTA — prominent AI orb entry point to the assistant */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2 }}
        className="relative w-full overflow-hidden rounded-2xl shadow-card"
        style={{ background: 'linear-gradient(120deg, #14532d 0%, #15803d 55%, #0f766e 100%)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(420px 160px at 85% 18%, rgba(217,119,6,0.35), transparent 70%)' }} />
        <div
          role="button"
          tabIndex={0}
          onClick={onTalk}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTalk(); } }}
          aria-label={talkTitle}
          className="relative w-full text-left group cursor-pointer p-4 sm:p-5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-shrink-0 pointer-events-none" aria-hidden="true">
              <VoiceOrb state="idle" size={92} title={talkTitle} />
            </div>
            <div className="flex-1 min-w-0 text-white">
              <p className="text-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Voice Assistant</p>
              <p className="font-display text-lg sm:text-2xl font-semibold tracking-tight mt-0.5">{talkTitle}</p>
              <p className="text-base sm:text-lg text-white/85 mt-1 font-medium">
                How can I help your farm today?
              </p>
              <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> {tapToSpeak} · {typeInstead}
              </p>
              <p className="text-[11px] text-white/45 mt-1.5 italic hidden sm:block">Listen Like a Farmer. Think with Trusted Data. Advise in Your Language.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </div>

        {/* Quick actions — jump straight into the features farmers ask for most */}
        <div className="relative flex flex-wrap gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Today's Farm Advisor (existing advisor logic, restyled) */}
      <FarmAdvisor weather={weather} weatherLoading={weatherLoading} />

      {/* Feature grid — desktop 3-col hierarchy, tablet 2-col, mobile 1-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2 xl:col-span-2"><WeatherCard weather={weather} loading={weatherLoading} index={0} /></div>
        <SafetyCard warnings={warnings} loading={weatherLoading} index={1} />
        <div className="md:col-span-2 xl:col-span-2"><MarketCard index={2} /></div>
        <RecommendationCard index={3} />
        <CropHealthCard lastAnalysis={analyses?.[0] ?? null} loading={analyses === null} index={4} />
        <SellCropCard index={5} />
        <FarmTasksCard index={6} />
        <div className="md:col-span-2 xl:col-span-3"><HistoryCard analyses={analyses ?? []} index={7} /></div>
      </div>

      {/* Secondary features link (unchanged destination) */}
      <DashboardCard
        to="/more"
        icon={<Sprout className="w-6 h-6" />}
        title={moreLabel}
        description="Profit, Schemes, Support, Soil, Crop Recommendation, Settings"
        actionLabel="Open More"
        accent="stone"
      />

      {/* Farm profile (existing farmer details, restyled) */}
      {farmerDetails && (
        <Link to="/farmer-details" className="card-premium flex items-center gap-3 group">
          <span className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-xl flex-shrink-0">🧑‍🌾</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-800">{farmerDetails.name || 'Farmer'}</p>
            <p className="text-sm text-ink-500 truncate">
              {farmerDetails.crop ? `Growing: ${farmerDetails.crop}` : 'Complete your farm profile'}
              {farmerDetails.landArea ? ` · ${farmerDetails.landArea} ${farmerDetails.landUnit}` : ''}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
      )}
    </>
  );
}

/* Today's Farm Advisor — identical content/logic to before, presented as a
   premium AI advisory panel with entrance animation. */
function FarmAdvisor({ weather, weatherLoading }: { weather: WeatherResult['current']; weatherLoading: boolean }) {
  const { t } = useApp();
  const advices: { icon: React.ReactNode; category: string; text: string; label: string; labelClass: string }[] = [];

  if (weatherLoading) {
    advices.push({ icon: <CloudRain className="w-4 h-4" />, category: 'Weather', text: 'Checking current weather conditions...', label: '⏳', labelClass: 'badge-info' });
  } else if (weather) {
    if (weather.rainProbability && weather.rainProbability > 50) {
      advices.push({ icon: <CloudRain className="w-4 h-4" />, category: 'Weather', text: 'Rain is expected. Check drainage in your field.', label: '✓ VERIFIED', labelClass: 'badge-verified' });
    } else if (weather.temperature && weather.temperature > 38) {
      advices.push({ icon: <Sun className="w-4 h-4" />, category: 'Weather', text: 'High temperature today. Ensure adequate irrigation for your crops.', label: '✓ VERIFIED', labelClass: 'badge-verified' });
    } else {
      advices.push({ icon: <CloudSun className="w-4 h-4" />, category: 'Weather', text: `Current temperature is ${weather.temperature}°C. Monitor your crops for stress signs.`, label: '✓ VERIFIED', labelClass: 'badge-verified' });
    }
  }

  const month = new Date().getMonth() + 1;
  const isKharif = month >= 6 && month <= 11;
  advices.push({
    icon: <Leaf className="w-4 h-4" />,
    category: 'Crop',
    text: isKharif ? 'Kharif season is active. Monitor for pest and disease pressure.' : 'Rabi season preparation. Plan your crop selection and inputs.',
    label: '🤖 AI ANALYSIS',
    labelClass: 'badge-ai',
  });

  advices.push({
    icon: <TrendingUp className="w-4 h-4" />,
    category: 'Market',
    text: 'Check the Market page for the latest verified mandi prices in your area.',
    label: '📊 ESTIMATE',
    labelClass: 'badge-estimate',
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="card-premium"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title text-sm flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand-600/10 text-brand-700 flex items-center justify-center">
            <Sprout className="w-4 h-4" />
          </span>
          {t('todayAdvisor')}
        </h3>
        <span className="text-eyebrow">Daily Briefing</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {advices.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-2.5 rounded-xl bg-stone-50/80 border border-stone-200/60 p-3"
          >
            <div className="text-brand-700 flex-shrink-0 mt-0.5">{a.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{a.category}</p>
              <p className="text-sm text-ink-700 leading-snug mt-0.5">{a.text}</p>
              <span className={`badge ${a.labelClass} mt-1.5`}>{a.label}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
