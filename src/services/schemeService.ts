import type { GovernmentScheme, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface SchemeResult {
  schemes: GovernmentScheme[];
  source: SourceMetadata;
  available: boolean;
}

export function getKnownSchemes(): GovernmentScheme[] {
  const lastChecked = formatLastUpdated(new Date());
  return [
    {
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      level: 'Central',
      eligibility: 'Small and marginal farmer families holding cultivable land. Land ownership documents required.',
      benefits: 'Rs. 6,000 per year in three equal instalments of Rs. 2,000 each, directly to bank account.',
      documents: ['Aadhaar', 'Land records', 'Bank account details', 'Citizenship proof'],
      applicationMethod: 'Online registration on PM-KISAN portal or through Common Service Centres (CSCs)',
      applicationLink: OFFICIAL_SOURCES.PMKISAN.url,
      deadline: null,
      status: 'Ongoing scheme. Check portal for current instalment status.',
      source: OFFICIAL_SOURCES.PMKISAN.name,
      lastChecked,
      eligibilityLabel: 'info-required',
    },
    {
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      level: 'Central',
      eligibility: 'All farmers growing notified crops in notified areas. Loanee farmers are automatically enrolled.',
      benefits: 'Crop insurance against natural calamities, pests and diseases at subsidized premium rates.',
      documents: ['Aadhaar', 'Land records', 'Bank account details', 'Sowing certificate'],
      applicationMethod: 'Contact local bank, CSC, or agriculture department. Enrollment before sowing season.',
      applicationLink: 'https://pmfby.gov.in/',
      deadline: 'Varies by state and crop season. Check official portal.',
      status: 'Season-based enrollment. Check portal for current enrollment window.',
      source: 'PMFBY (pmfby.gov.in)',
      lastChecked,
      eligibilityLabel: 'info-required',
    },
    {
      name: 'Kisan Credit Card (KCC)',
      level: 'Central',
      eligibility: 'All farmers including tenant farmers, sharecroppers, and oral lessees. Also available for fisheries and animal husbandry.',
      benefits: 'Easy access to short-term credit for agricultural needs at subsidized interest rates.',
      documents: ['Aadhaar', 'Land records', 'Bank account details', 'Identity proof'],
      applicationMethod: 'Apply through your bank branch or online through the bank portal.',
      applicationLink: 'https://www.myscheme.gov.in/schemes/kcc',
      deadline: null,
      status: 'Ongoing scheme. Apply anytime.',
      source: OFFICIAL_SOURCES.MYSCHEME.name,
      lastChecked,
      eligibilityLabel: 'possibly-eligible',
    },
    {
      name: 'Agriculture Infrastructure Fund (AIF)',
      level: 'Central',
      eligibility: 'Farmers, FPOs, PACS, entrepreneurs, startups for post-harvest infrastructure projects.',
      benefits: 'Loans up to Rs. 2 crore with 3% interest subvention and credit guarantee.',
      documents: ['Project report', 'Land documents', 'Aadhaar', 'Bank details'],
      applicationMethod: 'Apply through banks with project report. Check official portal for details.',
      applicationLink: 'https://www.agriinfrafund.dac.gov.in/',
      deadline: 'Ongoing. Check portal for current status.',
      status: 'Ongoing scheme.',
      source: OFFICIAL_SOURCES.MYSCHEME.name,
      lastChecked,
      eligibilityLabel: 'info-required',
    },
    {
      name: 'Soil Health Card Scheme',
      level: 'Central',
      eligibility: 'All farmers with cultivable land.',
      benefits: 'Free soil testing and personalized soil health card with nutrient recommendations.',
      documents: ['Land records', 'Aadhaar'],
      applicationMethod: 'Visit local soil testing laboratory, KVK, or agriculture department office.',
      applicationLink: 'https://www.myscheme.gov.in/schemes/shc',
      deadline: null,
      status: 'Ongoing. Contact local agriculture office.',
      source: OFFICIAL_SOURCES.MYSCHEME.name,
      lastChecked,
      eligibilityLabel: 'possibly-eligible',
    },
  ];
}

export function fetchSchemes(_state?: string, _crop?: string): SchemeResult {
  // The myScheme portal has an API but it may not be accessible without proper keys.
  // We provide known schemes with official source links and clearly mark them.
  void _state;
  void _crop;
  try {
    const schemes = getKnownSchemes();
    return {
      schemes,
      source: {
        sourceName: OFFICIAL_SOURCES.MYSCHEME.name,
        sourceUrl: OFFICIAL_SOURCES.MYSCHEME.url,
        sourceType: 'OFFICIAL',
        isLive: false,
        isVerified: true,
        lastUpdated: formatLastUpdated(new Date()),
        status: 'available',
      },
      available: true,
    };
  } catch {
    return {
      schemes: [],
      source: {
        sourceName: OFFICIAL_SOURCES.MYSCHEME.name,
        sourceUrl: OFFICIAL_SOURCES.MYSCHEME.url,
        sourceType: 'OFFICIAL',
        isLive: false,
        isVerified: true,
        lastUpdated: formatLastUpdated(new Date()),
        status: 'unavailable',
      },
      available: false,
    };
  }
}

export interface MySchemeSearchResult {
  available: boolean;
  schemes: GovernmentScheme[];
}

export async function searchMySchemeAPI(query: string): Promise<MySchemeSearchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(
      `https://www.myscheme.gov.in/api/v1/search?query=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    );
    if (!res.ok) throw new Error('myScheme API unavailable');
    const data: unknown = await res.json();
    const schemes = getApiRecords(data).map(toGovernmentScheme).filter((scheme): scheme is GovernmentScheme => scheme !== null);
    if (schemes.length === 0) {
      return { available: false, schemes: [] };
    }
    return { available: true, schemes };
  } catch {
    return { available: false, schemes: [] };
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface SchemeSearchResult {
  schemes: GovernmentScheme[];
  isLive: boolean;
}

export async function searchSchemes(query: string): Promise<SchemeSearchResult> {
  const normalizedQuery = query.trim();
  const localMatches = filterKnownSchemes(normalizedQuery);
  if (!normalizedQuery) return { schemes: localMatches, isLive: false };

  const liveResult = await searchMySchemeAPI(normalizedQuery);
  if (liveResult.available) {
    return { schemes: liveResult.schemes, isLive: true };
  }

  // The public endpoint may be unavailable to browsers. Searching the known,
  // official-link catalogue keeps the search usable without mislabelling it as live data.
  return { schemes: localMatches, isLive: false };
}

function filterKnownSchemes(query: string): GovernmentScheme[] {
  const normalizedQuery = query.toLowerCase();
  return getKnownSchemes().filter((scheme) => {
    if (!normalizedQuery) return true;
    return [scheme.name, scheme.eligibility, scheme.benefits, scheme.source, ...scheme.documents]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

function getApiRecords(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data)) return [];
  const candidates = [data.schemes, data.results, data.data];
  const records = candidates.find(Array.isArray);
  return records ? records.filter(isRecord) : [];
}

function toGovernmentScheme(record: Record<string, unknown>): GovernmentScheme | null {
  const name = readRecordText(record, ['name', 'scheme_name', 'schemeName', 'title']);
  if (!name) return null;

  const description = readRecordText(record, ['benefits', 'description', 'details', 'summary']) || 'See the official portal for complete benefits and eligibility.';
  const rawLevel = readRecordText(record, ['level', 'government_level', 'category']).toLowerCase();
  const level: GovernmentScheme['level'] = rawLevel.includes('state') ? 'State' : rawLevel.includes('district') ? 'District' : 'Central';
  const applicationLink = toSafeApplicationLink(readRecordText(record, ['application_link', 'apply_url', 'url', 'link']));

  return {
    name,
    level,
    eligibility: readRecordText(record, ['eligibility', 'eligible_for', 'eligibility_criteria']) || 'Check eligibility on the official portal.',
    benefits: description,
    documents: readDocuments(record.documents),
    applicationMethod: readRecordText(record, ['application_method', 'how_to_apply', 'apply_process']) || 'Open the official portal for application instructions.',
    applicationLink,
    deadline: readRecordText(record, ['deadline', 'last_date', 'application_deadline']) || null,
    status: readRecordText(record, ['status', 'scheme_status']) || null,
    source: OFFICIAL_SOURCES.MYSCHEME.name,
    lastChecked: formatLastUpdated(new Date()),
    eligibilityLabel: 'info-required',
  };
}

function readDocuments(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function readRecordText(record: Record<string, unknown>, fields: string[]): string {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function toSafeApplicationLink(value: string): string {
  if (!value) return OFFICIAL_SOURCES.MYSCHEME.url;
  try {
    const url = new URL(value, OFFICIAL_SOURCES.MYSCHEME.url);
    return url.protocol === 'https:' ? url.toString() : OFFICIAL_SOURCES.MYSCHEME.url;
  } catch {
    return OFFICIAL_SOURCES.MYSCHEME.url;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const ELIGIBILITY_LABELS: Record<GovernmentScheme['eligibilityLabel'], { text: string; emoji: string; color: string }> = {
  eligible: { text: 'Likely Eligible', emoji: '🟢', color: 'bg-green-100 text-green-800' },
  'info-required': { text: 'More Information Required', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800' },
  'possibly-eligible': { text: 'Possibly Eligible', emoji: '🟠', color: 'bg-orange-100 text-orange-800' },
  'not-eligible': { text: 'Not Eligible Based on Available Information', emoji: '🔴', color: 'bg-red-100 text-red-800' },
};
