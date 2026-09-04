import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface SellCropRoute {
  routeType: string;
  title: string;
  description: string;
  steps: string[];
  officialLink: string;
  officialLinkLabel: string;
  source: string;
}

export function getSellCropRoutes(): SellCropRoute[] {
  return [
    {
      routeType: 'enam',
      title: 'e-NAM Seller Route',
      description:
        'Register on e-NAM to sell your produce through an online, transparent auction system across participating APMC mandis. This is a marketplace and price-discovery platform, NOT a guaranteed direct sale.',
      steps: [
        'Register as a farmer on e-NAM',
        'Bring your produce to the nearest e-NAM APMC mandi',
        'Get your lot assayed and graded',
        'Your lot appears in the online auction',
        'Traders bid on your produce',
        'Receive payment directly to your bank account',
      ],
      officialLink: OFFICIAL_SOURCES.ENAM.register,
      officialLinkLabel: 'Register as Farmer',
      source: 'e-NAM (enam.gov.in)',
    },
    {
      routeType: 'apmc',
      title: 'APMC / Mandi Route',
      description:
        'Sell through your nearest Agricultural Produce Market Committee (APMC) mandi. Check the official e-NAM APMC contacts directory for mandi details.',
      steps: [
        'Find your nearest APMC mandi',
        'Bring your produce to the mandi',
        'Get quality assayed',
        'Sell through auction or direct trade',
        'Receive payment as per mandi rules',
      ],
      officialLink: OFFICIAL_SOURCES.ENAM.apmcContacts,
      officialLinkLabel: 'View APMC Contacts',
      source: 'e-NAM APMC Directory (enam.gov.in)',
    },
    {
      routeType: 'fpo',
      title: 'FPO / FPC Route',
      description:
        'Farmer Producer Organizations (FPOs) and Farmer Producer Companies (FPCs) enable collective selling, which can improve bargaining power and market access.',
      steps: [
        'Join or form a local FPO/FPC',
        'Aggregate produce with other farmers',
        'Negotiate better prices collectively',
        'Access bulk buyers and institutional markets',
        'Share logistics and storage costs',
      ],
      officialLink: 'https://enam.gov.in/',
      officialLinkLabel: 'Learn More',
      source: 'e-NAM / FPO resources',
    },
    {
      routeType: 'procurement',
      title: 'Government Procurement',
      description:
        'Government agencies procure certain crops at Minimum Support Price (MSP). Check official notifications for procurement centers in your area.',
      steps: [
        'Check if your crop has MSP procurement',
        'Find the nearest procurement center',
        'Ensure your crop meets quality standards',
        'Register with the procurement center',
        'Sell at MSP to the government agency',
      ],
      officialLink: OFFICIAL_SOURCES.PMKISAN.url,
      officialLinkLabel: 'Check PM-KISAN / Procurement Info',
      source: 'PM-KISAN (pmkisan.gov.in)',
    },
    {
      routeType: 'logistics',
      title: 'Logistics & Transport',
      description:
        'e-NAM provides logistics support through its platform for transporting produce from mandi to buyer.',
      steps: [
        'Use e-NAM logistics portal',
        'Get transport quotes',
        'Track your shipment',
        'Ensure proper packaging for quality',
      ],
      officialLink: OFFICIAL_SOURCES.ENAM.url,
      officialLinkLabel: 'Open e-NAM',
      source: 'e-NAM Logistics (enam.gov.in)',
    },
  ];
}

export interface BuyerInfo {
  companyName: string;
  commodity: string;
  location: string;
  procurementInfo: string;
  contact: string;
  source: string;
  lastChecked: string;
  verified: boolean;
}

// We do NOT invent buyers. We return an empty array and show the
// appropriate "not available" message.
export function getVerifiedBuyers(): { buyers: BuyerInfo[]; available: boolean } {
  return {
    buyers: [],
    available: false,
  };
}

export function getUnverifiedBuyerMessage(): string {
  return 'Verified direct buyer information is not currently available. Please use the e-NAM marketplace and APMC routes above to find buyers through the official trading platform.';
}

export function getSellCropLastChecked(): string {
  return formatLastUpdated(new Date());
}
