import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface KnowledgeEntry {
  category: string;
  title: string;
  description: string;
  managementSteps: string[];
  prevention: string[];
  source: string;
  sourceUrl: string;
}

export function getAgricultureKnowledge(crop: string, problem: string): KnowledgeEntry | null {
  const lower = problem.toLowerCase();

  // General knowledge entries - source-backed from ICAR/NCIPM
  const entries: Record<string, KnowledgeEntry> = {
    'fungal-disease': {
      category: 'Disease Management',
      title: 'Fungal Disease Management',
      description: 'General guidance for managing fungal diseases in crops. Always verify the specific disease with a KVK or agriculture officer before treatment.',
      managementSteps: [
        'Remove and destroy affected plant parts to prevent spread',
        'Improve air circulation through proper plant spacing',
        'Avoid overhead irrigation to reduce leaf wetness',
        'Use disease-resistant varieties in future seasons',
        'Practice crop rotation to break disease cycles',
        'Consult KVK for specific, verified treatment recommendations',
      ],
      prevention: [
        'Use certified, disease-free seeds',
        'Practice crop rotation',
        'Maintain field hygiene',
        'Monitor crops regularly for early detection',
      ],
      source: OFFICIAL_SOURCES.ICAR.name,
      sourceUrl: OFFICIAL_SOURCES.ICAR.url,
    },
    'pest-management': {
      category: 'Pest Management',
      title: 'Integrated Pest Management (IPM)',
      description: 'IPM combines cultural, mechanical, biological, and chemical methods to manage pests sustainably. Chemical treatment should be a last resort.',
      managementSteps: [
        'Cultural: Use crop rotation, resistant varieties, and proper timing',
        'Mechanical: Hand picking, light traps, pheromone traps',
        'Biological: Encourage natural predators, use biopesticides like neem',
        'Chemical: Only as last resort, and only with verified recommendations from KVK',
        'Monitor pest populations regularly with traps and field scouting',
      ],
      prevention: [
        'Regular field scouting and monitoring',
        'Intercropping with pest-repellent plants',
        'Maintaining field hygiene',
        'Using pheromone traps for early detection',
      ],
      source: 'ICAR-NCIPM (National Centre for Integrated Pest Management)',
      sourceUrl: 'https://ncipm.icar.gov.in/',
    },
    'nutrient-deficiency': {
      category: 'Nutrient Management',
      title: 'Nutrient Deficiency Management',
      description: 'Nutrient deficiencies require proper diagnosis through soil testing before any application. Never guess nutrient requirements.',
      managementSteps: [
        'Get a soil test from a certified laboratory to confirm deficiency',
        'Apply only the recommended fertilizer type and dose',
        'Use balanced NPK application based on soil test results',
        'Consider organic sources like compost and vermicompost',
        'Apply micronutrients only if soil test confirms deficiency',
      ],
      prevention: [
        'Regular soil testing every 2-3 years',
        'Balanced fertilizer application',
        'Organic matter incorporation',
        'Crop rotation with legumes for natural nitrogen fixation',
      ],
      source: OFFICIAL_SOURCES.ICAR.name,
      sourceUrl: OFFICIAL_SOURCES.ICAR.url,
    },
    'water-stress': {
      category: 'Water Management',
      title: 'Water Stress Management',
      description: 'Managing water stress requires understanding whether the issue is too little or too much water.',
      managementSteps: [
        'For drought: Apply irrigation, use mulching, prioritize critical growth stages',
        'For excess water: Improve drainage, avoid further irrigation, allow soil to dry',
        'Use drip or sprinkler irrigation for water efficiency',
        'Select drought-tolerant or flood-tolerant varieties for your area',
        'Harvest rainwater for dry periods',
      ],
      prevention: [
        'Efficient irrigation systems',
        'Water harvesting structures',
        'Mulching to conserve moisture',
        'Choose appropriate crops for your rainfall pattern',
      ],
      source: OFFICIAL_SOURCES.ICAR.name,
      sourceUrl: OFFICIAL_SOURCES.ICAR.url,
    },
  };

  if (lower.includes('fungal') || lower.includes('fungus') || lower.includes('spot') || lower.includes('lesion') || lower.includes('mold')) {
    return entries['fungal-disease'];
  }
  if (lower.includes('pest') || lower.includes('insect') || lower.includes('borer') || lower.includes('aphid')) {
    return entries['pest-management'];
  }
  if (lower.includes('nutrient') || lower.includes('deficiency') || lower.includes('yellow leaf')) {
    return entries['nutrient-deficiency'];
  }
  if (lower.includes('water') || lower.includes('drought') || lower.includes('flood') || lower.includes('dry') || lower.includes('wil')) {
    return entries['water-stress'];
  }

  void crop;
  return null;
}

export function getCropCalendar(crop: string): { season: string; activities: string[] }[] | null {
  const calendars: Record<string, { season: string; activities: string[] }[]> = {
    rice: [
      { season: 'Kharif (Jun-Jul)', activities: ['Land preparation', 'Nursery raising', 'Transplanting'] },
      { season: 'Vegetative (Jul-Sep)', activities: ['Weed control', 'Fertilizer application', 'Water management'] },
      { season: 'Reproductive (Sep-Nov)', activities: ['Panicle initiation', 'Flowering', 'Disease monitoring'] },
      { season: 'Harvest (Nov-Dec)', activities: ['Harvesting', 'Threshing', 'Drying and storage'] },
    ],
    wheat: [
      { season: 'Rabi (Nov-Dec)', activities: ['Land preparation', 'Sowing', 'First irrigation'] },
      { season: 'Vegetative (Jan-Feb)', activities: ['Fertilizer top dressing', 'Weed control', 'Irrigation'] },
      { season: 'Reproductive (Feb-Mar)', activities: ['Heading', 'Flowering', 'Grain filling'] },
      { season: 'Harvest (Mar-Apr)', activities: ['Harvesting', 'Threshing', 'Storage'] },
    ],
  };
  const key = crop.toLowerCase();
  return calendars[key] || null;
}

export function getLastChecked(): string {
  return formatLastUpdated(new Date());
}
