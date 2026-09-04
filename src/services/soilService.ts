import type { SoilTestData } from '@/types';

export interface SoilLab {
  name: string;
  type: string;
  findUrl: string;
  description: string;
}

export function getSoilTestingLabs(): SoilLab[] {
  // We don't invent lab contacts. We provide official portals for finding labs.
  return [
    {
      name: 'Soil Testing Laboratories Directory',
      type: 'Government Soil Labs',
      findUrl: 'https://soilhealth.dac.gov.in/',
      description: 'Official portal for finding government soil testing laboratories near you.',
    },
    {
      name: 'Krishi Vigyan Kendras (KVKs)',
      type: 'ICAR KVKs',
      findUrl: 'https://kvk.icar.gov.in/',
      description: 'KVKs provide soil testing services and agricultural advisory. Find your nearest KVK on the official ICAR portal.',
    },
    {
      name: 'District Agriculture Office',
      type: 'Government Office',
      findUrl: 'https://agricoop.gov.in/',
      description: 'Contact your district agriculture office for soil testing facilities and information.',
    },
    {
      name: 'Agricultural Universities',
      type: 'University Labs',
      findUrl: 'https://icar.gov.in/',
      description: 'State agricultural universities often have soil testing laboratories. Check the ICAR portal for universities in your state.',
    },
  ];
}

export function saveSoilTest(data: SoilTestData) {
  localStorage.setItem('smartfarm_soil_test', JSON.stringify(data));
}

export function loadSoilTest(): SoilTestData | null {
  const raw = localStorage.getItem('smartfarm_soil_test');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SoilTestData;
  } catch {
    return null;
  }
}

export function clearSoilTest() {
  localStorage.removeItem('smartfarm_soil_test');
}

export function hasSoilTest(): boolean {
  return loadSoilTest() !== null;
}
