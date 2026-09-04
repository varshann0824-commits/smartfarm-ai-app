import { useApp } from '@/context/AppContext';
import { PageWrapper } from '@/components/PageWrapper';
import { DashboardCard } from '@/components/DashboardCard';
import { DemoBanner } from '@/components/DataBadges';
import { Mic, Sprout, Camera, TrendingUp, Handshake, CloudSun, ShieldAlert, Settings, Leaf, CloudRain, Sun, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WeatherData } from '@/types';
import { fetchWeather } from '@/services/weatherService';

export function DashboardPage() {
  const { t, location, demoMode, farmerDetails, detectLocation, isDetectingLocation } = useApp();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const locationText = [location.city, location.district, location.state].filter(Boolean).join(', ');

  useEffect(() => {
    if (location.latitude && location.longitude) {
      setWeatherLoading(true);
      fetchWeather(location.latitude, location.longitude)
        .then(r => setWeather(r.current))
        .finally(() => setWeatherLoading(false));
    }
  }, [location.latitude, location.longitude]);

  return (
    <PageWrapper showBackButton={false}>
      {demoMode && <div className="mb-4"><DemoBanner /></div>}

      {/* Location Bar */}
      <div className="card mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">📍</span>
          <div className="min-w-0">
            <p className="text-xs text-stone-500">{t('currentLocation')}</p>
            <p className="font-semibold text-stone-800 truncate">{locationText || 'Location not detected'}</p>
          </div>
        </div>
        <button
          onClick={() => detectLocation()}
          disabled={isDetectingLocation}
          className="btn btn-outline text-sm px-3 py-2 flex-shrink-0"
        >
          {isDetectingLocation ? '...' : '🔄'}
        </button>
      </div>

      {/* Today's Farm Advisor */}
      <FarmAdvisor weather={weather} weatherLoading={weatherLoading} locationText={locationText} />

      {/* Voice-First CTA */}
      <button
        onClick={() => navigate('/talk')}
        className="card mb-4 w-full bg-gradient-to-r from-green-700 to-green-600 text-white border-0 flex items-center gap-4 p-4 hover:from-green-800 hover:to-green-700 transition-all group"
      >
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <Mic className="w-8 h-8" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-lg">{t('talkToAI')}</p>
          <p className="text-sm text-green-50">🎤 {t('tapToSpeak')}</p>
        </div>
        <ArrowRight className="w-6 h-6 flex-shrink-0 opacity-70 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Tagline */}
      <p className="text-center text-xs text-stone-500 mb-4 italic px-2">
        Listen Like a Farmer. Think with Trusted Data. Advise in Your Language.
      </p>

      {/* Quick Weather Snippet */}
      {weather && (
        <div className="card mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CloudSun className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-stone-500">{t('weather')}</p>
              <p className="font-semibold text-stone-800">{weather.temperature}°C · {weather.condition}</p>
            </div>
            <span className="text-xs text-stone-400">{weather.source}</span>
          </div>
        </div>
      )}

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DashboardCard to="/crop-health" icon={<Camera className="w-6 h-6" />} title={t('cropHealth')} description="Check your crop for problems" actionLabel={t('checkCropHealth')} accent="teal" />
        <DashboardCard to="/market" icon={<TrendingUp className="w-6 h-6" />} title={t('marketPrice')} description="Check today's verified mandi prices" actionLabel={t('viewPrices')} accent="blue" />
        <DashboardCard to="/sell-crop" icon={<Handshake className="w-6 h-6" />} title={t('sellCrop')} description="Find verified selling pathways" actionLabel={t('findBuyers')} accent="orange" />
        <DashboardCard to="/weather" icon={<CloudSun className="w-6 h-6" />} title={t('weather')} description="Forecast and weather warnings" actionLabel={t('viewWeather')} accent="blue" />
        <DashboardCard to="/safety" icon={<ShieldAlert className="w-6 h-6" />} title={t('safety')} description="Official weather and disaster alerts" actionLabel="Check Safety" accent="red" />
      </div>

      {/* Secondary features link */}
      <div className="mt-4">
        <DashboardCard to="/more" icon={<Settings className="w-6 h-6" />} title={t('more')} description="Profit, Schemes, Support, Soil, Crop Recommendation, Settings" actionLabel="Open More" accent="stone" />
      </div>

      {farmerDetails && (
        <div className="card mt-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧑‍🌾</span>
            <div>
              <p className="font-semibold text-stone-800">{farmerDetails.name || 'Farmer'}</p>
              {farmerDetails.crop && <p className="text-sm text-stone-600">Growing: {farmerDetails.crop}</p>}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function FarmAdvisor({ weather, weatherLoading, locationText }: { weather: WeatherData | null; weatherLoading: boolean; locationText: string }) {
  const { t } = useApp();
  const advices: { icon: React.ReactNode; category: string; text: string; label: string; labelClass: string }[] = [];

  if (weatherLoading) {
    advices.push({ icon: <CloudRain className="w-5 h-5" />, category: 'Weather', text: 'Checking current weather conditions...', label: '⏳', labelClass: 'badge-info' });
  } else if (weather) {
    if (weather.rainProbability && weather.rainProbability > 50) {
      advices.push({ icon: <CloudRain className="w-5 h-5" />, category: 'Weather', text: 'Rain is expected. Check drainage in your field.', label: '✓ VERIFIED', labelClass: 'badge-verified' });
    } else if (weather.temperature && weather.temperature > 38) {
      advices.push({ icon: <Sun className="w-5 h-5" />, category: 'Weather', text: 'High temperature today. Ensure adequate irrigation for your crops.', label: '✓ VERIFIED', labelClass: 'badge-verified' });
    } else {
      advices.push({ icon: <CloudSun className="w-5 h-5" />, category: 'Weather', text: `Current temperature is ${weather.temperature}°C. Monitor your crops for stress signs.`, label: '✓ VERIFIED', labelClass: 'badge-verified' });
    }
  }

  const month = new Date().getMonth() + 1;
  const isKharif = month >= 6 && month <= 11;
  advices.push({
    icon: <Leaf className="w-5 h-5" />,
    category: 'Crop',
    text: isKharif ? 'Kharif season is active. Monitor for pest and disease pressure.' : 'Rabi season preparation. Plan your crop selection and inputs.',
    label: '🤖 AI ANALYSIS',
    labelClass: 'badge-ai',
  });

  if (locationText) {
    advices.push({
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'Market',
      text: 'Check the Market page for the latest verified mandi prices in your area.',
      label: '📊 ESTIMATE',
      labelClass: 'badge-estimate',
    });
  }

  return (
    <div className="card mb-4 bg-green-50 border-green-200">
      <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
        <Sprout className="w-5 h-5 text-green-700" />
        {t('todayAdvisor')}
      </h3>
      <div className="space-y-2">
        {advices.map((a, i) => (
          <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2.5">
            <div className="text-green-700 flex-shrink-0 mt-0.5">{a.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-700">{a.text}</p>
              <span className={`badge ${a.labelClass} mt-1`}>{a.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
