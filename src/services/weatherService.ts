import type { WeatherData, WeatherForecastDay, WeatherWarning, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface WeatherResult {
  current: WeatherData | null;
  forecast: WeatherForecastDay[];
  warnings: WeatherWarning[];
  source: SourceMetadata;
  fallback: boolean;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherResult> {
  // IMD doesn't provide a freely accessible public API without registration.
  // We use Open-Meteo as a clearly-labelled FALLBACK source.
  try {
    const currentRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`,
    );
    if (!currentRes.ok) throw new Error('Weather fetch failed');
    const data = await currentRes.json();
    const now = new Date();

    // Use today's daily rain probability for current weather
    const todayRainProb = data.daily?.precipitation_probability_max?.[0] ?? null;

    const current: WeatherData = {
      temperature: Math.round(data.current?.temperature_2m ?? 0),
      feelsLike: data.current?.apparent_temperature ? Math.round(data.current.apparent_temperature) : null,
      humidity: data.current?.relative_humidity_2m ?? null,
      rainfall: data.current?.precipitation ?? null,
      rainProbability: todayRainProb,
      windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
      condition: weatherCodeToText(data.current?.weather_code ?? 0),
      source: 'Open-Meteo',
      lastUpdated: formatLastUpdated(now),
    };

    const forecast: WeatherForecastDay[] = (data.daily?.time || []).map((time: string, i: number) => ({
      date: time,
      tempMax: Math.round(data.daily.temperature_2m_max[i] ?? 0),
      tempMin: Math.round(data.daily.temperature_2m_min[i] ?? 0),
      rainProbability: data.daily.precipitation_probability_max?.[i] ?? null,
      condition: weatherCodeToText(data.daily.weather_code?.[i] ?? 0),
    }));

    // Generate basic warnings from severe weather codes
    const warnings: WeatherWarning[] = [];
    const todayCode = data.daily?.weather_code?.[0] ?? 0;
    const todayMax = data.daily?.temperature_2m_max?.[0] ?? null;
    const todayMin = data.daily?.temperature_2m_min?.[0] ?? null;
    const currentWindSpeed = data.current?.wind_speed_10m ?? null;
    if ([95, 96, 99].includes(todayCode)) {
      warnings.push({
        id: 'thunderstorm-today',
        level: 'ORANGE',
        title: 'Thunderstorm expected today',
        area: 'Your location',
        issueTime: formatLastUpdated(now),
        validUntil: data.daily?.time?.[0] || '',
        source: 'Open-Meteo (FALLBACK)',
        actions: ['Stay indoors during thunderstorm', 'Avoid open fields and tall trees', 'Protect livestock'],
      });
    }
    if ([65, 82].includes(todayCode)) {
      warnings.push({
        id: 'heavy-rain-today',
        level: 'YELLOW',
        title: 'Heavy rain expected today',
        area: 'Your location',
        issueTime: formatLastUpdated(now),
        validUntil: data.daily?.time?.[0] || '',
        source: 'Open-Meteo (FALLBACK)',
        actions: ['Ensure proper drainage in fields', 'Delay harvest if possible', 'Protect stored produce'],
      });
    }
    if (todayMax !== null && todayMax >= 40) {
      warnings.push({
        id: 'heat-stress-today',
        level: 'ORANGE',
        title: 'High heat stress risk today',
        area: 'Your location',
        issueTime: formatLastUpdated(now),
        validUntil: data.daily?.time?.[0] || '',
        source: 'Open-Meteo (FALLBACK)',
        actions: ['Irrigate during cooler hours where appropriate', 'Provide water and shade for livestock', 'Avoid field work during peak afternoon heat'],
      });
    }
    if (todayMin !== null && todayMin <= 5) {
      warnings.push({
        id: 'cold-stress-today',
        level: 'YELLOW',
        title: 'Low temperature risk today',
        area: 'Your location',
        issueTime: formatLastUpdated(now),
        validUntil: data.daily?.time?.[0] || '',
        source: 'Open-Meteo (FALLBACK)',
        actions: ['Protect young plants where practical', 'Avoid irrigation during the coldest hours', 'Monitor livestock for cold stress'],
      });
    }
    if (currentWindSpeed !== null && currentWindSpeed >= 45) {
      warnings.push({
        id: 'strong-wind-now',
        level: 'YELLOW',
        title: 'Strong winds at your location',
        area: 'Your location',
        issueTime: formatLastUpdated(now),
        validUntil: data.daily?.time?.[0] || '',
        source: 'Open-Meteo (FALLBACK)',
        actions: ['Avoid spraying while winds are strong', 'Secure loose covers and farm equipment', 'Keep clear of damaged trees and power lines'],
      });
    }

    return {
      current,
      forecast,
      warnings,
      source: {
        sourceName: `${OFFICIAL_SOURCES.OPEN_METEO.name} (FALLBACK WEATHER SOURCE)`,
        sourceUrl: OFFICIAL_SOURCES.OPEN_METEO.url,
        sourceType: 'FALLBACK',
        isLive: true,
        isVerified: false,
        lastUpdated: formatLastUpdated(now),
        status: 'available',
      },
      fallback: true,
    };
  } catch {
    return {
      current: null,
      forecast: [],
      warnings: [],
      source: {
        sourceName: OFFICIAL_SOURCES.OPEN_METEO.name,
        sourceUrl: OFFICIAL_SOURCES.OPEN_METEO.url,
        sourceType: 'FALLBACK',
        isLive: false,
        isVerified: false,
        lastUpdated: formatLastUpdated(new Date()),
        status: 'unavailable',
      },
      fallback: false,
    };
  }
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
