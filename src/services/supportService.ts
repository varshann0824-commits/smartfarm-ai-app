import type { SupportCenter, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface SupportResult {
  centers: SupportCenter[];
  source: SourceMetadata;
  available: boolean;
  officialHelpline: { name: string; phone: string; url: string };
  kisanSarathiUrl: string;
}

export function getSupportInfo(_state?: string, _district?: string): SupportResult {
  // We do NOT invent support center names, addresses, or phone numbers.
  // We provide official portals where farmers can find their nearest center.
  // _state/_district are reserved for future location-aware lookups.
  void _state;
  void _district;
  const now = new Date();
  return {
    centers: [],
    source: {
      sourceName: 'Official Agriculture Support Network',
      sourceUrl: OFFICIAL_SOURCES.KISAN_SARATHI.url,
      sourceType: 'OFFICIAL',
      isLive: false,
      isVerified: true,
      lastUpdated: formatLastUpdated(now),
      status: 'available',
    },
    available: false,
    officialHelpline: {
      name: 'Kisan Call Center (KCC)',
      phone: '1800-180-1551',
      url: 'https://kisansarathi.in/',
    },
    kisanSarathiUrl: OFFICIAL_SOURCES.KISAN_SARATHI.url,
  };
}

export function getSupportTypes(): { type: string; description: string; findUrl: string }[] {
  return [
    {
      type: 'Krishi Vigyan Kendra (KVK)',
      description: 'Agricultural science centers providing technology and training to farmers. Run by ICAR.',
      findUrl: 'https://kvk.icar.gov.in/',
    },
    {
      type: 'District Agriculture Office',
      description: 'Government office providing agricultural extension services, scheme information, and support.',
      findUrl: 'https://agricoop.gov.in/',
    },
    {
      type: 'Block / Mandal Agriculture Office',
      description: 'Local-level agriculture office for day-to-day farming support and scheme applications.',
      findUrl: 'https://agricoop.gov.in/',
    },
    {
      type: 'State Agriculture Department',
      description: 'State-level department for agriculture policies, schemes, and support programs.',
      findUrl: 'https://agricoop.gov.in/',
    },
    {
      type: 'Horticulture Department',
      description: 'Department for horticulture crops - fruits, vegetables, flowers, spices.',
      findUrl: 'https://agricoop.gov.in/',
    },
    {
      type: 'Rythu Bharosa / Rythu Seva Kendras (Andhra Pradesh)',
      description: 'Farmer support centers in Andhra Pradesh providing multiple agricultural services.',
      findUrl: 'https://apagrisnet.gov.in/',
    },
  ];
}
