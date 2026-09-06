import type { WeatherWarning } from '@/types';
import { fetchWeather } from './weatherService';
import type { SourceMetadata } from '@/types';

export interface DisasterAlertResult {
  warnings: WeatherWarning[];
  available: boolean;
  officialSourceUrl: string;
  source: SourceMetadata;
  fallback: boolean;
}

export async function checkDisasterAlerts(lat: number, lon: number): Promise<DisasterAlertResult> {
  // Official IMD warnings require registration. Reuse the clearly labelled
  // Open-Meteo fallback so the Safety page can surface actual severe-weather
  // conditions without presenting them as official IMD alerts.
  const weather = await fetchWeather(lat, lon);
  return {
    warnings: weather.warnings,
    available: weather.source.status === 'available',
    officialSourceUrl: 'https://mausam.imd.gov.in/',
    source: weather.source,
    fallback: weather.fallback,
  };
}

export const WARNING_LEVELS = {
  RED: { color: 'bg-red-600 text-white', emoji: '🔴', label: 'RED' },
  ORANGE: { color: 'bg-orange-500 text-white', emoji: '🟠', label: 'ORANGE' },
  YELLOW: { color: 'bg-yellow-400 text-stone-900', emoji: '🟡', label: 'YELLOW' },
  INFORMATION: { color: 'bg-sky-100 text-sky-800', emoji: 'ℹ', label: 'INFORMATION' },
} as const;
