export type FreshnessLevel = 'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE';

export interface FreshnessResult {
  level: FreshnessLevel;
  ageInHours: number;
  label: string;
  warning: string | null;
}

const HOURS_RECENT = 24;
const HOURS_STALE = 72;

export function validateFreshness(lastUpdated: string | null | undefined): FreshnessResult {
  if (!lastUpdated || lastUpdated === 'unavailable') {
    return {
      level: 'UNAVAILABLE',
      ageInHours: -1,
      label: 'Unavailable',
      warning: 'Data source is currently unavailable. The information shown may not be current.',
    };
  }

  const parsed = new Date(lastUpdated);
  if (isNaN(parsed.getTime())) {
    return {
      level: 'UNAVAILABLE',
      ageInHours: -1,
      label: 'Unknown',
      warning: 'Could not determine when this data was last updated.',
    };
  }

  const now = new Date();
  const ageMs = now.getTime() - parsed.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 6) {
    return {
      level: 'FRESH',
      ageInHours: Math.round(ageHours),
      label: 'Fresh',
      warning: null,
    };
  }

  if (ageHours <= HOURS_RECENT) {
    return {
      level: 'RECENT',
      ageInHours: Math.round(ageHours),
      label: 'Recent',
      warning: null,
    };
  }

  if (ageHours <= HOURS_STALE) {
    return {
      level: 'STALE',
      ageInHours: Math.round(ageHours),
      label: 'Stale',
      warning: 'This data is more than 1 day old. Prices may have changed. Please verify with the official source.',
    };
  }

  return {
    level: 'STALE',
    ageInHours: Math.round(ageHours),
    label: 'Outdated',
    warning: 'This data is significantly outdated. Please check the official source for current information.',
  };
}

export function freshnessBadge(level: FreshnessLevel): { color: string; text: string } {
  switch (level) {
    case 'FRESH':
      return { color: 'bg-green-100 text-green-800', text: '🟢 Fresh' };
    case 'RECENT':
      return { color: 'bg-blue-100 text-blue-800', text: '🔵 Recent' };
    case 'STALE':
      return { color: 'bg-amber-100 text-amber-800', text: '🟡 Stale' };
    case 'UNAVAILABLE':
      return { color: 'bg-red-100 text-red-800', text: '🔴 Unavailable' };
  }
}
