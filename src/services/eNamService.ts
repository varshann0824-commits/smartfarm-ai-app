import { OFFICIAL_SOURCES } from './sourceMetadata';

export interface ENamInfo {
  overview: string;
  registrationSteps: string[];
  benefits: string[];
  officialLinks: { label: string; url: string }[];
}

export function getENamInfo(): ENamInfo {
  return {
    overview:
      'e-NAM (National Agriculture Market) is a pan-India electronic trading portal that networks existing APMC mandis to create a unified national market for agricultural commodities. It provides an online, transparent, competitive price discovery system.',
    registrationSteps: [
      'Visit the official e-NAM farmer registration page',
      'Provide Aadhaar number and bank account details',
      'Enter land/farm details and crop information',
      'Get verified by the local APMC',
      'Start trading on the e-NAM platform',
    ],
    benefits: [
      'Online transparent price discovery',
      'Wider market access beyond local mandi',
      'Direct online payment to bank account',
      'Reduced intermediary costs',
      'Access to quality assaying and grading',
      'Logistics support through the platform',
    ],
    officialLinks: [
      { label: 'e-NAM Official Website', url: OFFICIAL_SOURCES.ENAM.url },
      { label: 'Register as Farmer', url: OFFICIAL_SOURCES.ENAM.register },
      { label: 'APMC Contact Details', url: OFFICIAL_SOURCES.ENAM.apmcContacts },
      { label: 'Contact e-NAM', url: OFFICIAL_SOURCES.ENAM.contact },
    ],
  };
}

export interface MandiInfo {
  name: string;
  state: string;
  district: string;
  enamEnabled: boolean;
  contactUrl: string;
}

// We don't hard-code APMC contacts since that could be inaccurate.
// We provide the official APMC contacts directory link instead.
export function getMandiDirectoryUrl(): string {
  return OFFICIAL_SOURCES.ENAM.apmcContacts;
}

export function getEnamUrl(): string {
  return OFFICIAL_SOURCES.ENAM.url;
}

export function getEnamRegisterUrl(): string {
  return OFFICIAL_SOURCES.ENAM.register;
}

export function getEnamContactUrl(): string {
  return OFFICIAL_SOURCES.ENAM.contact;
}
