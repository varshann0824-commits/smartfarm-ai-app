import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo, LoadingSpinner, ErrorState } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { fetchWeather, type WeatherResult } from '@/services/weatherService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { Droplets, CloudRain, Wind, Thermometer, CloudSun, Calendar, AlertTriangle, Navigation } from 'lucide-react';

export function WeatherPage() {
  const { t, location } = useApp();
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!location.latitude || !location.longitude) {
      setError('Location is needed for weather information. Please allow location access.');
      setLoading(false);
      return;
    }
    try {
      const r = await fetchWeather(location.latitude, location.longitude, {
        district: location.district,
        state: location.state,
      });
      if (!r.current) {
        // The service resolves with no data when both the official source and
        // the fallback failed. Surface the existing error + Retry state rather
        // than rendering a weather page with nothing on it.
        setError(r.notice || 'Live weather information is temporarily unavailable. Please check your connection and try again.');
        return;
      }
      setResult(r);
    } catch {
      setError('Live weather information is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, location.district, location.state]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <PageWrapper title={`\u2601\uFE0F ${t('weather')}`}>
      {loading && <LoadingSpinner label="Loading weather..." />}

      {error && !loading && (
        <ErrorState
          message={error}
          onRetry={loadData}
          officialLink={OFFICIAL_SOURCES.IMD.url}
        />
      )}

      {!loading && !error && result && result.current && (
        <>
          {/* Data source label — always shows the actual source */}
          <div
            className={`card mb-4 border ${
              result.fallback ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
            }`}
          >
            <p className={`text-sm font-semibold ${result.fallback ? 'text-amber-800' : 'text-green-800'}`}>
              {result.fallback
                ? '⚠ Data source: Open-Meteo (fallback)'
                : '🟢 Data source: India Meteorological Department (IMD)'}
            </p>
            {result.fallback && (
              <p className="text-sm text-amber-800 mt-1">
                {result.notice ||
                  'IMD weather service unavailable. Data is from Open-Meteo (fallback) — not official IMD data.'}
              </p>
            )}
            {!result.fallback && result.stationName && (
              <p className="text-xs text-green-700 mt-1">
                IMD station: {result.stationName}
                {result.stationDistanceKm !== null && result.stationDistanceKm !== undefined
                  ? ` (${result.stationDistanceKm} km from your location)`
                  : ''}
              </p>
            )}
          </div>

          {/* Current Weather */}
          <div className="card mb-4 bg-gradient-to-br from-blue-50 to-stone-50">
            <div className="flex items-center gap-3 mb-4">
              <CloudSun className="w-12 h-12 text-blue-600" />
              <div>
                <p className="text-3xl font-bold text-stone-800">{result.current.temperature}°C</p>
                <p className="text-stone-600">{result.current.condition}</p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <DataBadge status="live" />
                <span
                  className={`badge ${
                    result.current.source === 'IMD' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {result.current.source === 'IMD' ? 'IMD' : 'Open-Meteo (fallback)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <WeatherStat icon={<Thermometer className="w-4 h-4" />} label="Feels Like" value={result.current.feelsLike !== null ? `${result.current.feelsLike}°C` : '-'} />
              <WeatherStat icon={<Droplets className="w-4 h-4" />} label="Humidity" value={result.current.humidity !== null ? `${result.current.humidity}%` : '-'} />
              <WeatherStat icon={<CloudRain className="w-4 h-4" />} label="Rainfall" value={result.current.rainfall !== null ? `${result.current.rainfall} mm` : '-'} />
              <WeatherStat
                icon={<Wind className="w-4 h-4" />}
                label="Wind"
                value={
                  result.current.windSpeed !== null
                    ? `${result.current.windSpeed} km/h${result.current.windDirection ? ` ${result.current.windDirection}` : ''}`
                    : '-'
                }
              />
            </div>
            {result.current.windDirection && (
              <p className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Wind direction: {result.current.windDirection}
              </p>
            )}
          </div>

          {/* 7-Day Forecast */}
          {result.forecast.length > 0 ? (
            <div className="card mb-4">
              <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> 7-Day Forecast
              </h3>
              <div className="space-y-2">
                {result.forecast.map((day, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg p-2.5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-700">
                        {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-stone-500">{day.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-800">{day.tempMax}° / {day.tempMin}°</p>
                      {day.rainProbability !== null && (
                        <p className="text-xs text-blue-600">🌧 {day.rainProbability}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              {/* Forecast data is unavailable — it is never invented, so show the
                  existing error state with a Retry that reuses the normal fetch flow. */}
              <ErrorState
                message={`7-day forecast is not available right now. ${result.source.sourceName} did not return forecast data for your location. Please try again in a few minutes.`}
                onRetry={loadData}
                officialLink={OFFICIAL_SOURCES.IMD.url}
              />
            </div>
          )}

          {/* Warnings */}
          <div className="card mb-4">
            <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Weather Warnings
            </h3>
            {result.warnings.length === 0 ? (
              <div>
                <p className="text-sm text-stone-600 mb-3">
                   No active weather warnings from {result.source.sourceName}. For official IMD warnings, please check the IMD website directly.
                 </p>
                <a href={OFFICIAL_SOURCES.IMD.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm px-4 py-2">
                  Check IMD Official Warnings →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-semibold text-red-800">{w.title}</p>
                    <p className="text-sm text-stone-700">{w.area}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SourceInfo source={result.source} />

          {/* IMD attribution */}
          <p className="text-xs text-stone-400 mt-3 mb-2 text-center">
            Weather data © India Meteorological Department (IMD), Ministry of Earth Sciences, Government of India.
            {' '}<a href={OFFICIAL_SOURCES.IMD.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">mausam.imd.gov.in</a>
          </p>
        </>
      )}
    </PageWrapper>
  );
}

function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-stone-100">
      <span className="text-stone-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="font-semibold text-stone-800 text-sm">{value}</p>
      </div>
    </div>
  );
}