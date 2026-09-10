import type { WeatherData, WeatherForecastDay, WeatherWarning, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface WeatherResult {
  current: WeatherData | null;
  forecast: WeatherForecastDay[];
  warnings: WeatherWarning[];
  source: SourceMetadata;
  fallback: boolean;
  /** Human-readable explanation of why a fallback is being used, if any. */
  notice?: string | null;
  /** Exact reason the official IMD source was unavailable, if it was. */
  imdError?: string | null;
  /** Official IMD station that provided the data (when source is IMD). */
  stationName?: string | null;
  /** Distance from the user's location to that IMD station, in km. */
  stationDistanceKm?: number | null;
}

const REQUEST_TIMEOUT_MS = 15_000;

// Client-side cache (IMD recommends caching to reduce request load).
// Cached results are reused briefly; the UI still labels the true source.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map<string, { at: number; result: WeatherResult }>();

function getCached(lat: number, lon: number): WeatherResult | null {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const hit = weatherCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.result;
  if (hit) weatherCache.delete(key);
  return null;
}

function setCached(lat: number, lon: number, result: WeatherResult): void {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  weatherCache.set(key, { at: Date.now(), result });
  if (weatherCache.size > 20) {
    const oldest = [...weatherCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) weatherCache.delete(oldest[0]);
  }
}

function withTimeout(signalController: AbortController): { signal: AbortSignal; done: () => void } {
  const timeoutId = setTimeout(() => signalController.abort(), REQUEST_TIMEOUT_MS);
  return { signal: signalController.signal, done: () => clearTimeout(timeoutId) };
}

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function imdSource(lastUpdated: string): SourceMetadata {
  return {
    sourceName: OFFICIAL_SOURCES.IMD.name,
    sourceUrl: OFFICIAL_SOURCES.IMD.url,
    sourceType: 'OFFICIAL',
    isLive: true,
    isVerified: true,
    lastUpdated,
    status: 'available',
  };
}

function openMeteoFallbackSource(lastUpdated: string): SourceMetadata {
  return {
    sourceName: `${OFFICIAL_SOURCES.OPEN_METEO.name} (fallback)`,
    sourceUrl: OFFICIAL_SOURCES.OPEN_METEO.url,
    sourceType: 'FALLBACK',
    isLive: true,
    isVerified: false,
    lastUpdated,
    status: 'available',
  };
}

function unavailableSource(lastUpdated: string): SourceMetadata {
  return {
    sourceName: OFFICIAL_SOURCES.IMD.name,
    sourceUrl: OFFICIAL_SOURCES.IMD.url,
    sourceType: 'OFFICIAL',
    isLive: false,
    isVerified: true,
    lastUpdated,
    status: 'unavailable',
  };
}

interface EdgeFunctionWarning {
  level: string | null;
  title: string;
  area: string;
  issueTime: string;
  validUntil: string;
  rawText: string;
}

interface EdgeFunctionWeather {
  source: 'IMD' | 'Open-Meteo';
  fallback: boolean;
  notice: string | null;
  imd?: { status: 'available' | 'unavailable'; error: string | null };
  stationName?: string | null;
  stationDistanceKm?: number | null;
  current: {
    temperature: number | null;
    feelsLike: number | null;
    humidity: number | null;
    rainfall: number | null;
    rainProbability: number | null;
    windSpeed: number | null;
    windDirection?: string | null;
    condition: string | null;
  };
  forecast: {
    date: string;
    tempMax: number | null;
    tempMin: number | null;
    rainfall: number | null;
    rainProbability: number | null;
    windSpeed?: number | null;
    condition: string | null;
  }[];
  warnings?: EdgeFunctionWarning[];
}

function isEdgeFunctionWeather(value: unknown): value is EdgeFunctionWeather {
  if (!isRecord(value)) return false;
  if (value.source !== 'IMD' && value.source !== 'Open-Meteo') return false;
  return isRecord(value.current) && Array.isArray(value.forecast);
}

/**
 * Fetch weather via the Supabase Edge Function ("weather"), which tries the
 * official IMD API server-side (key never exposed to the browser) and falls
 * back to Open-Meteo with an explicit, clearly-labelled source.
 */
async function fetchViaEdgeFunction(
  lat: number,
  lon: number,
  district?: string | null,
): Promise<WeatherResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Supabase is not configured.');
  }
  const baseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (district && district.trim()) params.append('district', district.trim());
  const url = `${baseUrl}/functions/v1/weather?${params.toString()}`;

  const controller = new AbortController();
  const { signal, done } = withTimeout(controller);
  try {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(url, {
      signal,
      headers: {
        ...(anonKey ? { apikey: anonKey } : {}),
      },
    });
    if (!res.ok) throw new Error(`Weather service responded with ${res.status}.`);
    const data: unknown = await res.json();
    if (isRecord(data) && typeof data.error === 'string' && data.error) {
      throw new Error(data.error);
    }
    if (!isEdgeFunctionWeather(data)) {
      throw new Error('The weather service returned an unexpected response.');
    }
    if (isRecord(data.current) && data.current.temperature === null && data.forecast.length === 0) {
      throw new Error('No weather data available from the weather service.');
    }

    const lastUpdated = formatLastUpdated(new Date());
    const sourceLabel: WeatherData['source'] = data.source === 'IMD' ? 'IMD' : 'Open-Meteo';

    const current: WeatherData = {
      temperature: data.current.temperature,
      feelsLike: data.current.feelsLike,
      humidity: data.current.humidity,
      rainfall: data.current.rainfall,
      rainProbability: data.current.rainProbability,
      windSpeed: data.current.windSpeed,
      windDirection: data.current.windDirection ?? null,
      condition: data.current.condition ?? 'Unknown',
      source: sourceLabel,
      lastUpdated,
    };

    const forecast: WeatherForecastDay[] = data.forecast.map((day) => ({
      date: day.date,
      tempMax: day.tempMax,
      tempMin: day.tempMin,
      rainProbability: day.rainProbability,
      condition: day.condition ?? 'Unknown',
    }));

    // Official IMD warnings when the source is IMD; derived warnings only for
    // the fallback source (clearly labelled).
    const warnings: WeatherWarning[] = data.source === 'IMD' && Array.isArray(data.warnings)
      ? data.warnings.map((w, i) => ({
          id: `imd-warning-${i}`,
          level: (w.level === 'RED' || w.level === 'ORANGE' || w.level === 'YELLOW' || w.level === 'INFORMATION'
            ? w.level
            : 'INFORMATION') as WeatherWarning['level'],
          title: w.rawText || w.title,
          area: w.area || 'Your district',
          issueTime: w.issueTime || lastUpdated,
          validUntil: w.validUntil || '',
          source: 'IMD',
          actions: [],
        }))
      : deriveWarnings(current, forecast);

    return {
      current,
      forecast,
      warnings,
      source: data.source === 'IMD' ? imdSource(lastUpdated) : openMeteoFallbackSource(lastUpdated),
      fallback: data.source !== 'IMD',
      notice: data.notice,
      imdError: data.imd?.status === 'unavailable' ? data.imd.error : null,
      stationName: data.stationName ?? null,
      stationDistanceKm: data.stationDistanceKm ?? null,
    };
  } finally {
    done();
  }
}

/**
 * Direct Open-Meteo fetch — used only as a second-level fallback when the
 * Edge Function itself is unreachable (e.g. not deployed). Always labelled
 * as a fallback source.
 */
async function fetchOpenMeteoDirect(lat: number, lon: number): Promise<WeatherResult> {
  const controller = new AbortController();
  const { signal, done } = withTimeout(controller);
  try {
    const currentRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`,
      { signal },
    );
    if (!currentRes.ok) throw new Error('Weather fetch failed');
    const data: unknown = await currentRes.json();
    if (!isRecord(data)) throw new Error('Weather fetch failed');
    const now = new Date();
    const currentRec = isRecord(data.current) ? data.current : {};
    const dailyRec = isRecord(data.daily) ? data.daily : {};
    const dailyTimes = Array.isArray(dailyRec.time) ? (dailyRec.time as unknown[]) : [];
    const arr = (key: string): unknown[] => (Array.isArray(dailyRec[key]) ? (dailyRec[key] as unknown[]) : []);

    // Use today's daily rain probability for current weather
    const todayRainProb = num(arr('precipitation_probability_max')[0]);

    const current: WeatherData = {
      temperature: num(currentRec.temperature_2m),
      feelsLike: num(currentRec.apparent_temperature),
      humidity: num(currentRec.relative_humidity_2m),
      rainfall: num(currentRec.precipitation),
      rainProbability: todayRainProb,
      windSpeed: num(currentRec.wind_speed_10m),
      windDirection: null,
      condition: weatherCodeToText(num(currentRec.weather_code) ?? 0),
      source: 'Open-Meteo',
      lastUpdated: formatLastUpdated(now),
    };

    const forecast: WeatherForecastDay[] = dailyTimes.map((time, i) => ({
      date: String(time),
      tempMax: num(arr('temperature_2m_max')[i]),
      tempMin: num(arr('temperature_2m_min')[i]),
      rainProbability: num(arr('precipitation_probability_max')[i]),
      condition: weatherCodeToText(num(arr('weather_code')[i]) ?? 0),
    }));

    return {
      current,
      forecast,
      warnings: deriveWarnings(current, forecast),
      source: openMeteoFallbackSource(formatLastUpdated(now)),
      fallback: true,
      notice: 'The weather service was unreachable. Showing Open-Meteo (fallback) data directly.',
    };
  } finally {
    done();
  }
}

/**
 * Primary entry point. Tries the official IMD source (via server-side Edge
 * Function, so no API key is exposed) and falls back to Open-Meteo, always
 * labelling which source actually provided the data. No data is ever faked:
 * if both sources fail, current is null and the UI shows an error.
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  locationHint?: { district?: string | null; state?: string | null },
): Promise<WeatherResult> {
  const cached = getCached(lat, lon);
  if (cached) return cached;

  try {
    const result = await fetchViaEdgeFunction(lat, lon, locationHint?.district ?? null);
    setCached(lat, lon, result);
    return result;
  } catch {
    // Edge Function unreachable/not deployed: direct Open-Meteo fallback.
    try {
      const result = await fetchOpenMeteoDirect(lat, lon);
      setCached(lat, lon, result);
      return result;
    } catch {
      return {
        current: null,
        forecast: [],
        warnings: [],
        source: unavailableSource(formatLastUpdated(new Date())),
        fallback: false,
        notice: 'IMD weather service unavailable, and the fallback source could not be reached.',
        imdError: 'IMD weather service unavailable.',
      };
    }
  }
}

// Derive basic agricultural warnings from live conditions (never fabricated:
// only triggered when real data shows the risky condition).
function deriveWarnings(current: WeatherData, forecast: WeatherForecastDay[]): WeatherWarning[] {
  const warnings: WeatherWarning[] = [];
  const now = formatLastUpdated(new Date());
  const today = forecast[0];
  const sourceName = current.source === 'IMD' ? 'IMD' : 'Open-Meteo (fallback)';
  const conditionText = `${today?.condition ?? current.condition}`.toLowerCase();

  if (/thunderstorm/i.test(conditionText)) {
    warnings.push({
      id: 'thunderstorm-today',
      level: 'ORANGE',
      title: 'Thunderstorm expected today',
      area: 'Your location',
      issueTime: now,
      validUntil: today?.date || '',
      source: sourceName,
      actions: ['Stay indoors during thunderstorm', 'Avoid open fields and tall trees', 'Protect livestock'],
    });
  }
  if (/heavy rain|violent showers/i.test(conditionText)) {
    warnings.push({
      id: 'heavy-rain-today',
      level: 'YELLOW',
      title: 'Heavy rain expected today',
      area: 'Your location',
      issueTime: now,
      validUntil: today?.date || '',
      source: sourceName,
      actions: ['Ensure proper drainage in fields', 'Delay harvest if possible', 'Protect stored produce'],
    });
  }
  if (today?.tempMax !== null && today?.tempMax !== undefined && today.tempMax >= 40) {
    warnings.push({
      id: 'heat-stress-today',
      level: 'ORANGE',
      title: 'High heat stress risk today',
      area: 'Your location',
      issueTime: now,
      validUntil: today?.date || '',
      source: sourceName,
      actions: ['Irrigate during cooler hours where appropriate', 'Provide water and shade for livestock', 'Avoid field work during peak afternoon heat'],
    });
  }
  if (today?.tempMin !== null && today?.tempMin !== undefined && today.tempMin <= 5) {
    warnings.push({
      id: 'cold-stress-today',
      level: 'YELLOW',
      title: 'Low temperature risk today',
      area: 'Your location',
      issueTime: now,
      validUntil: today?.date || '',
      source: sourceName,
      actions: ['Protect young plants where practical', 'Avoid irrigation during the coldest hours', 'Monitor livestock for cold stress'],
    });
  }
  if (current.windSpeed !== null && current.windSpeed >= 45) {
    warnings.push({
      id: 'strong-wind-now',
      level: 'YELLOW',
      title: 'Strong winds at your location',
      area: 'Your location',
      issueTime: now,
      validUntil: today?.date || '',
      source: sourceName,
      actions: ['Avoid spraying while winds are strong', 'Secure loose covers and farm equipment', 'Keep clear of damaged trees and power lines'],
    });
  }
  return warnings;
}

export function weatherCodeToText(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail',
  };
  return map[code] || 'Unknown';
}

export async function fetchWeatherWarnings(_lat: number, _lon: number): Promise<WeatherWarning[]> {
  // Official IMD warnings require API access that is not publicly available without registration.
  // We return an empty array and clearly show the official source link for farmers to check manually.
  void _lat;
  void _lon;
  return [];
}