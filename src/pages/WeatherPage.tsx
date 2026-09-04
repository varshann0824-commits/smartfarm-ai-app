import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo, LoadingSpinner, ErrorState } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { fetchWeather, type WeatherResult } from '@/services/weatherService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { Droplets, CloudRain, Wind, Thermometer, CloudSun, Calendar, AlertTriangle } from 'lucide-react';

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
      const r = await fetchWeather(location.latitude, location.longitude);
      setResult(r);
    } catch {
      setError('Live weather information is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

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
          {/* Fallback notice */}
          {result.fallback && (
            <div className="card mb-4 bg-amber-50 border-amber-200">
              <p className="text-sm text-amber-800">
                ⚠ FALLBACK WEATHER SOURCE: Data is from Open-Meteo, not from IMD. For official weather warnings, please check the IMD website.
              </p>
            </div>
          )}

          {/* Current Weather */}
          <div className="card mb-4 bg-gradient-to-br from-blue-50 to-stone-50">
            <div className="flex items-center gap-3 mb-4">
              <CloudSun className="w-12 h-12 text-blue-600" />
              <div>
                <p className="text-3xl font-bold text-stone-800">{result.current.temperature}°C</p>
                <p className="text-stone-600">{result.current.condition}</p>
              </div>
              <div className="ml-auto">
                <DataBadge status="live" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <WeatherStat icon={<Thermometer className="w-4 h-4" />} label="Feels Like" value={result.current.feelsLike !== null ? `${result.current.feelsLike}°C` : '-'} />
              <WeatherStat icon={<Droplets className="w-4 h-4" />} label="Humidity" value={result.current.humidity !== null ? `${result.current.humidity}%` : '-'} />
              <WeatherStat icon={<CloudRain className="w-4 h-4" />} label="Rainfall" value={result.current.rainfall !== null ? `${result.current.rainfall} mm` : '-'} />
              <WeatherStat icon={<Wind className="w-4 h-4" />} label="Wind" value={result.current.windSpeed !== null ? `${result.current.windSpeed} km/h` : '-'} />
            </div>
          </div>

          {/* 7-Day Forecast */}
          {result.forecast.length > 0 && (
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
          )}

          {/* Warnings */}
          <div className="card mb-4">
            <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Weather Warnings
            </h3>
            {result.warnings.length === 0 ? (
              <div>
                <p className="text-sm text-stone-600 mb-3">
                  No active weather warnings from the fallback source. For official IMD warnings, please check the IMD website directly.
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
