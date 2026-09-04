import type { SourceMetadata } from '@/types';

export function createSource(
  sourceName: string,
  sourceType: SourceMetadata['sourceType'],
  status: SourceMetadata['status'] = 'available',
  sourceUrl?: string,
): SourceMetadata {
  return {
    sourceName,
    sourceUrl,
    sourceType,
    isLive: sourceType === 'OFFICIAL' && status === 'available',
    isVerified: sourceType === 'OFFICIAL' || sourceType === 'VERIFIED',
    lastUpdated: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status,
  };
}

export const OFFICIAL_SOURCES = {
  AGMARKNET: {
    name: 'AGMARKNET / data.gov.in',
    url: 'https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi',
    website: 'https://agmarknet.gov.in/',
  },
  ENAM: {
    name: 'e-NAM (National Agriculture Market)',
    url: 'https://enam.gov.in/',
    register: 'https://beta.enam.gov.in/register',
    apmcContacts: 'https://enam.gov.in/apmc-contact-details',
    contact: 'https://enam.gov.in/contact-us',
  },
  IMD: {
    name: 'India Meteorological Department',
    url: 'https://mausam.imd.gov.in/',
    apiDocs: 'https://api.imd.gov.in/public/api_reference.html',
  },
  OPEN_METEO: {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com/',
  },
  MYSCHEME: {
    name: 'myScheme',
    url: 'https://www.myscheme.gov.in/',
  },
  PMKISAN: {
    name: 'PM-KISAN',
    url: 'https://pmkisan.gov.in/',
  },
  ICAR: {
    name: 'ICAR (Indian Council of Agricultural Research)',
    url: 'https://icar.gov.in/',
  },
  KISAN_SARATHI: {
    name: 'Kisan SARATHI',
    url: 'https://kisansarathi.in/',
  },
} as const;

export function formatLastUpdated(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
