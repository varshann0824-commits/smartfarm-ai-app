import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { MapPin, RefreshCw, Sparkles, Droplets, Wind, Sprout, CalendarDays, Bell, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { isKharifSeason } from '@/services/cropRecommendationService';
import type { WeatherData } from '@/types';
import { AnimatedWeatherIcon, conditionType } from './weatherVisuals';

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Dashboard hero — branding, farmer/location, live weather summary, AI status.
 * Pure CSS/motion agricultural background (hills, sun, drifting clouds) — no canvas.
 */
export function DashboardHero({ weather, loading }: { weather: WeatherData | null; loading: boolean }) {
  const { location: userLocation, demoMode, farmerDetails, detectLocation, isDetectingLocation, locationError, t } = useApp();
  const reduce = useReducedMotion();
  const [bgLoaded, setBgLoaded] = useState(false);
  const locationText = [userLocation.city, userLocation.district, userLocation.state].filter(Boolean).join(', ');
  const season = isKharifSeason() ? 'Kharif' : 'Rabi';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl shadow-hero text-white"
      style={{ background: '#17251d' }}
    >
      {/* Sharp realistic Indian farm photography — high-resolution, never
          blurred; readability comes from the gradient overlay below. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}assets/cinematic/field.jpg`}
          alt=""
          draggable={false}
          onLoad={() => setBgLoaded(true)}
          onError={() => setBgLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: bgLoaded ? 1 : 0,
            transition: 'opacity 0.9s ease',
            transform: 'scale(1.06)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(10,18,13,0.88) 0%, rgba(10,18,13,0.62) 46%, rgba(10,18,13,0.28) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: 'linear-gradient(180deg, rgba(10,18,13,0) 0%, rgba(10,18,13,0.45) 100%)' }}
        />
      </div>
      <HeroContent
        weather={weather}
        loading={loading}
        locationText={locationText}
        locationError={locationError}
        userLocation={userLocation}
        season={season}
        today={today}
        reduce={!!reduce}
        demoMode={demoMode}
        farmerName={farmerDetails?.name || ''}
        farmerCrop={farmerDetails?.crop || ''}
        detecting={isDetectingLocation}
        onDetect={() => detectLocation()}
        detectLabel={t('currentLocation')}
      />
    </motion.section>
  );
}

interface HeroContentProps {
  weather: WeatherData | null;
  loading: boolean;
  locationText: string;
  locationError: string | null;
  userLocation: { latitude: number | null; longitude: number | null; source: string };
  season: string;
  today: string;
  reduce: boolean;
  demoMode: boolean;
  farmerName: string;
  farmerCrop: string;
  detecting: boolean;
  onDetect: () => void;
  detectLabel: string;
}

function HeroContent({
  weather, loading, locationText, locationError, userLocation, season, today, reduce,
  demoMode, farmerName, farmerCrop, detecting, onDetect, detectLabel,
}: HeroContentProps) {
  return (
    <div className="relative p-5 sm:p-7">
      {/* Status row */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-brand-600/90 flex items-center justify-center shadow-glow">
            <Sprout className="w-5 h-5" />
          </span>
          <div>
            <p className="font-display font-semibold leading-tight tracking-tight">SmartFarm AI</p>
            <p className="text-[11px] text-white/55 leading-tight">Intelligent Farming Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/settings"
            aria-label="Notifications and sound settings"
            title="Notifications"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-white/85" />
          </Link>
          <Link
            to="/farmer-details"
            aria-label="Farm and profile information"
            title="Farm profile"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
          >
            <UserRound className="w-[18px] h-[18px] text-white/85" />
          </Link>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${demoMode ? 'bg-orange-400/20 text-orange-100' : 'bg-emerald-400/20 text-emerald-100'}`}>
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: demoMode ? '#fdba74' : '#6ee7b7' }}
              animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            {demoMode ? 'DEMO MODE' : 'AI ONLINE'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
        {/* Farmer + location */}
        <div className="min-w-0">
          <p className="text-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>{greetingForHour()}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5">
            {farmerName || 'Farmer'}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-white/70">
            <MapPin className={`w-4 h-4 flex-shrink-0 ${detecting ? 'text-amber-300 animate-pulse' : locationText ? 'text-emerald-300' : 'text-red-300'}`} />
            <span className="truncate max-w-[220px]">
              {detecting ? 'Detecting your location…' : locationError ? 'Unable to detect location — tap refresh' : locationText || 'Location not detected — tap refresh'}
            </span>
            <button
              onClick={onDetect}
              disabled={detecting}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label={detectLabel}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin-slow' : ''}`} />
              {!detecting && <span>Refresh</span>}
            </button>
          </div>
          {locationError && (
            <p className="mt-1 text-xs text-red-300 max-w-[280px] leading-snug">
              {locationError}
            </p>
          )}
          {userLocation.latitude && userLocation.longitude && userLocation.source === 'gps' && (
            <p className="mt-0.5 text-[10px] text-white/40 flex items-center gap-1">
              <span>Lat: {userLocation.latitude.toFixed(6)}</span>
              <span>Lng: {userLocation.longitude.toFixed(6)}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
              <CalendarDays className="w-3 h-3" />{today}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/25 px-2.5 py-1 text-[11px] font-medium text-lime-200">
              <Sprout className="w-3 h-3" />{season} season
            </span>
            {farmerCrop && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/85">
                Growing: {farmerCrop}
              </span>
            )}
          </div>
        </div>

        {/* Live weather summary */}
        <Link to="/weather" className="group flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 transition-colors">
          {loading ? (
            <div className="w-16 h-16 skeleton !bg-white/10" />
          ) : (
            <AnimatedWeatherIcon type={conditionType(weather?.condition)} size={64} color="#fbbf24" />
          )}
          <div>
            {loading ? (
              <>
                <div className="w-20 h-7 skeleton !bg-white/10 mb-1.5" />
                <div className="w-24 h-3.5 skeleton !bg-white/10" />
              </>
            ) : weather ? (
              <>
                <p className="font-display text-3xl font-semibold leading-none tracking-tight">
                  {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : '—'}
                </p>
                <p className="text-sm text-white/70 mt-1">{weather.condition}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/55">
                  {weather.humidity !== null && (
                    <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.humidity}%</span>
                  )}
                  {weather.windSpeed !== null && (
                    <span className="inline-flex items-center gap-1"><Wind className="w-3 h-3" />{Math.round(weather.windSpeed)} km/h</span>
                  )}
                  <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />{weather.source}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/60">Weather unavailable</p>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
