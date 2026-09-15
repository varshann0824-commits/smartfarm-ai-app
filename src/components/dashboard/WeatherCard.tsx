import { Link } from 'react-router-dom';
import { Droplets, Wind, CloudRain, ArrowRight } from 'lucide-react';
import type { WeatherData } from '@/types';
import { AnimatedWeatherIcon, conditionType } from './weatherVisuals';
import { AnimatedNumber, StaggerItem } from '@/components/ui/motion';

/**
 * Weather card — sky/clouds photography band with animated condition,
 * temperature emphasis. Renders only real data fetched by the existing
 * weather service.
 */
export function WeatherCard({ weather, loading, index }: { weather: WeatherData | null; loading: boolean; index: number }) {
  return (
    <StaggerItem index={index} className="h-full">
      <Link
        to="/weather"
        className="card-premium group relative h-full flex flex-col overflow-hidden hover:-translate-y-0.5 transition-transform duration-300"
      >
        {/* Sharp sky/clouds photography — weather should feel like the sky.
            Thin band only; the card body stays readable below. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 overflow-hidden">
          <img
            src={`${import.meta.env.BASE_URL}assets/cinematic/sky.jpg`}
            alt=""
            draggable={false}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-950/15 via-white/25 to-white" />
        </div>
        <div className="relative flex items-center justify-between">
          <p className="text-eyebrow">Live Weather</p>
          {weather && (
            <span className={`badge ${weather.source === 'IMD' ? 'badge-verified' : weather.source === 'DEMO' ? 'badge-demo' : 'badge-info'}`}>
              {weather.source}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-4 mt-4">
            <div className="w-20 h-20 skeleton" />
            <div className="flex-1">
              <div className="w-24 h-10 skeleton mb-2" />
              <div className="w-32 h-4 skeleton" />
            </div>
          </div>
        ) : weather ? (
          <>
            <div className="flex items-center gap-4 mt-4 relative">
              <AnimatedWeatherIcon type={conditionType(weather.condition)} size={84} />
              <div className="min-w-0">
                <div className="flex items-start">
                  <AnimatedNumber
                    value={weather.temperature}
                    className="font-display text-5xl font-semibold tracking-tight text-ink-900 leading-none"
                  />
                  <span className="text-xl font-medium text-ink-400 mt-1 ml-0.5">°C</span>
                </div>
                <p className="text-sm font-medium text-ink-600 mt-1.5 truncate">{weather.condition}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {weather.feelsLike !== null && (
                <StatChip label="Feels like" value={`${Math.round(weather.feelsLike)}°`} />
              )}
              {weather.humidity !== null && (
                <StatChip icon={<Droplets className="w-3.5 h-3.5" />} label="Humidity" value={`${weather.humidity}%`} />
              )}
              {weather.windSpeed !== null && (
                <StatChip icon={<Wind className="w-3.5 h-3.5" />} label="Wind" value={`${Math.round(weather.windSpeed)} km/h`} />
              )}
              {weather.rainProbability !== null && (
                <StatChip icon={<CloudRain className="w-3.5 h-3.5" />} label="Rain" value={`${weather.rainProbability}%`} />
              )}
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-ink-400">
              <span>Updated {weather.lastUpdated}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:gap-2 transition-all">
                Forecast <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center py-8">
            <p className="text-sm text-ink-400">Weather data unavailable. Tap to open the weather page.</p>
          </div>
        )}
      </Link>
    </StaggerItem>
  );
}

function StatChip({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 border border-stone-200/70 px-2.5 py-1.5 text-xs text-ink-600">
      {icon && <span className="text-ink-400">{icon}</span>}
      <span className="text-ink-400">{label}</span>
      <span className="font-semibold text-ink-800">{value}</span>
    </span>
  );
}
