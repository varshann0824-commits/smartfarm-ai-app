import type { WeatherWarning } from '@/types';

export interface DisasterAlertResult {
  warnings: WeatherWarning[];
  available: boolean;
  officialSourceUrl: string;
}

export async function checkDisasterAlerts(_lat: number, _lon: number): Promise<DisasterAlertResult> {
  // Official IMD warnings require their API which needs registration.
  // We return an empty list and show the official source link.
  // We NEVER create arbitrary "RED ALERT" from AI guesses.
  return {
    warnings: [],
    available: false,
    officialSourceUrl: 'https://mausam.imd.gov.in/',
  };
}

export const WARNING_LEVELS = {
  RED: { color: 'bg-red-600 text-white', emoji: '🔴', label: 'RED' },
  ORANGE: { color: 'bg-orange-500 text-white', emoji: '🟠', label: 'ORANGE' },
  YELLOW: { color: 'bg-yellow-400 text-stone-900', emoji: '🟡', label: 'YELLOW' },
  INFORMATION: { color: 'bg-sky-100 text-sky-800', emoji: 'ℹ', label: 'INFORMATION' },
} as const;
