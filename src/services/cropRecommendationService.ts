import type { CropRecommendation, RecommendationInput, ScoreFactor, SourceMetadata } from '@/types';
import { formatLastUpdated } from './sourceMetadata';

export interface RecommendationResult {
  recommendations: CropRecommendation[];
  source: SourceMetadata;
  hasSoilData: boolean;
  missingInputs: string[];
  inputSummary: Record<string, string>;
}

interface CropProfile {
  name: string;
  category: string;
  seasons: string[];
  waterRequirement: 'Low' | 'Medium' | 'High';
  growingPeriodDays: string;
  commonDiseases: string[];
  commonPests: string[];
  // Agronomic characteristics for scoring
  preferredSoilTypes: string[];
  preferredPhRange: [number, number];
  budgetLevel: 'Low' | 'Medium' | 'High';
  stateSuitability: Record<string, number>; // state -> suitability bonus (0-100)
  cropRotationNotes: string[];
  durationDays: [number, number];
  yieldRange: string;
  costRange: string;
  risks: string[];
}

// Broad India crop database with agronomic characteristics
// Based on ICAR / state agriculture department published crop suitability data
const CROP_PROFILES: CropProfile[] = [
  {
    name: 'Rice (Paddy)',
    category: 'Cereal',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'High',
    growingPeriodDays: '120-150',
    commonDiseases: ['Blast', 'Bacterial blight', 'Sheath rot'],
    commonPests: ['Stem borer', 'Leaf folder', 'Planthopper'],
    preferredSoilTypes: ['Clay', 'Clay Loam', 'Alluvial'],
    preferredPhRange: [5.5, 7.0],
    budgetLevel: 'Medium',
    stateSuitability: {
      'West Bengal': 95, 'Uttar Pradesh': 90, 'Andhra Pradesh': 90, 'Telangana': 85,
      'Punjab': 90, 'Haryana': 85, 'Tamil Nadu': 85, 'Odisha': 90, 'Bihar': 85,
      'Chhattisgarh': 90, 'Assam': 90, 'Kerala': 80, 'Karnataka': 75, 'Maharashtra': 70,
      'Jharkhand': 80, 'Madhya Pradesh': 75, 'Gujarat': 70,
    },
    cropRotationNotes: ['Avoid rice-rice continuous cropping', 'Good after pulses/legumes', 'Follow with wheat or mustard in rabi'],
    durationDays: [120, 150],
    yieldRange: '2-4 tonnes/acre',
    costRange: 'Rs. 25,000-35,000/acre',
    risks: ['Water stress', 'Pest infestation', 'Climate variability'],
  },
  {
    name: 'Wheat',
    category: 'Cereal',
    seasons: ['Rabi'],
    waterRequirement: 'Medium',
    growingPeriodDays: '120-150',
    commonDiseases: ['Rust (yellow/brown)', 'Karnal bunt', 'Loose smut'],
    commonPests: ['Aphid', 'Armyworm', 'Termites'],
    preferredSoilTypes: ['Loamy', 'Clay Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Punjab': 95, 'Haryana': 95, 'Uttar Pradesh': 90, 'Madhya Pradesh': 85,
      'Rajasthan': 75, 'Bihar': 80, 'Gujarat': 75, 'Maharashtra': 70,
      'West Bengal': 70, 'Jharkhand': 65, 'Chhattisgarh': 60,
    },
    cropRotationNotes: ['Excellent after rice in rice-wheat rotation', 'Good after pulses', 'Follow with moong or summer crops'],
    durationDays: [120, 150],
    yieldRange: '2.5-4 tonnes/acre',
    costRange: 'Rs. 22,000-30,000/acre',
    risks: ['Terminal heat stress', 'Rust diseases', 'Water scarcity'],
  },
  {
    name: 'Maize',
    category: 'Cereal',
    seasons: ['Kharif', 'Rabi', 'Zaid'],
    waterRequirement: 'Medium',
    growingPeriodDays: '90-120',
    commonDiseases: ['Fall armyworm', 'Stalk rot', 'Leaf blight'],
    commonPests: ['Stem borer', 'Fall armyworm', 'Aphid'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
    preferredPhRange: [5.5, 7.5],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Karnataka': 90, 'Andhra Pradesh': 85, 'Telangana': 85, 'Madhya Pradesh': 85,
      'Bihar': 80, 'Uttar Pradesh': 80, 'Rajasthan': 75, 'Maharashtra': 75,
      'Punjab': 75, 'Haryana': 70, 'Tamil Nadu': 75, 'Gujarat': 70,
    },
    cropRotationNotes: ['Good after legumes', 'Avoid continuous maize', 'Follow with wheat or pulses'],
    durationDays: [90, 120],
    yieldRange: '2-3.5 tonnes/acre',
    costRange: 'Rs. 20,000-28,000/acre',
    risks: ['Fall armyworm', 'Drought stress', 'Stalk rot'],
  },
  {
    name: 'Cotton',
    category: 'Cash Crop',
    seasons: ['Kharif'],
    waterRequirement: 'Medium',
    growingPeriodDays: '150-180',
    commonDiseases: ['Bollworm', 'Leaf curl virus', 'Wilt'],
    commonPests: ['Bollworm', 'Aphid', 'Whitefly', 'Thrips'],
    preferredSoilTypes: ['Black', 'Black Cotton', 'Alluvial'],
    preferredPhRange: [6.0, 8.0],
    budgetLevel: 'High',
    stateSuitability: {
      'Maharashtra': 90, 'Gujarat': 90, 'Telangana': 85, 'Andhra Pradesh': 80,
      'Punjab': 75, 'Haryana': 75, 'Karnataka': 75, 'Madhya Pradesh': 70,
      'Rajasthan': 65, 'Tamil Nadu': 65,
    },
    cropRotationNotes: ['Avoid cotton-cotton continuous cropping', 'Good after groundnut or pulses', 'Follow with wheat or gram'],
    durationDays: [150, 180],
    yieldRange: '1.5-3 quintals/acre',
    costRange: 'Rs. 30,000-45,000/acre',
    risks: ['Bollworm attack', 'Price volatility', 'Weather sensitivity'],
  },
  {
    name: 'Pigeon Pea (Tur/Arhar)',
    category: 'Pulse',
    seasons: ['Kharif'],
    waterRequirement: 'Low',
    growingPeriodDays: '150-210',
    commonDiseases: ['Pod borer', 'Wilt', 'Sterility mosaic'],
    commonPests: ['Pod borer', 'Pod fly', 'Maruka'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Red'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Maharashtra': 90, 'Karnataka': 85, 'Madhya Pradesh': 85, 'Uttar Pradesh': 80,
      'Telangana': 80, 'Andhra Pradesh': 75, 'Gujarat': 75, 'Rajasthan': 70,
      'Bihar': 70, 'Tamil Nadu': 65,
    },
    cropRotationNotes: ['Excellent nitrogen fixer', 'Good before wheat or mustard', 'Avoid continuous pigeon pea'],
    durationDays: [150, 210],
    yieldRange: '2-4 quintals/acre',
    costRange: 'Rs. 12,000-18,000/acre',
    risks: ['Pod borer', 'Wilt disease', 'Flowering-stage stress'],
  },
  {
    name: 'Groundnut',
    category: 'Oilseed',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'Low',
    growingPeriodDays: '100-130',
    commonDiseases: ['Tikka leaf spot', 'Aflatoxin contamination', 'Root rot'],
    commonPests: ['Aphid', 'Leaf miner', 'Pod borer'],
    preferredSoilTypes: ['Sandy', 'Sandy Loam', 'Red'],
    preferredPhRange: [5.5, 7.0],
    budgetLevel: 'Low',
    stateSuitability: {
      'Gujarat': 90, 'Andhra Pradesh': 85, 'Telangana': 80, 'Karnataka': 80,
      'Tamil Nadu': 75, 'Maharashtra': 75, 'Rajasthan': 70, 'Madhya Pradesh': 65,
    },
    cropRotationNotes: ['Good nitrogen fixer', 'Excellent before wheat or cotton', 'Avoid continuous groundnut'],
    durationDays: [100, 130],
    yieldRange: '4-8 quintals/acre',
    costRange: 'Rs. 18,000-25,000/acre',
    risks: ['Tikka leaf spot', 'Aflatoxin', 'Drought at pod formation'],
  },
  {
    name: 'Soybean',
    category: 'Oilseed',
    seasons: ['Kharif'],
    waterRequirement: 'Medium',
    growingPeriodDays: '90-120',
    commonDiseases: ['Yellow mosaic virus', 'Rhizoctonia root rot', 'Soybean rust'],
    commonPests: ['Semilooper', 'Stem fly', 'Girdle beetle'],
    preferredSoilTypes: ['Black', 'Clay Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Madhya Pradesh': 95, 'Maharashtra': 90, 'Rajasthan': 75, 'Karnataka': 70,
      'Telangana': 65, 'Chhattisgarh': 65, 'Gujarat': 60,
    },
    cropRotationNotes: ['Excellent nitrogen fixer', 'Good before wheat', 'Avoid continuous soybean'],
    durationDays: [90, 120],
    yieldRange: '3-5 quintals/acre',
    costRange: 'Rs. 16,000-24,000/acre',
    risks: ['Yellow mosaic virus', 'Sudden death syndrome', 'Waterlogging'],
  },
  {
    name: 'Mustard',
    category: 'Oilseed',
    seasons: ['Rabi'],
    waterRequirement: 'Low',
    growingPeriodDays: '110-140',
    commonDiseases: ['Aphids', 'White rust', 'Alternaria blight'],
    commonPests: ['Aphid', 'Painted bug', 'Leaf miner'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Rajasthan': 95, 'Haryana': 90, 'Uttar Pradesh': 85, 'Madhya Pradesh': 80,
      'Punjab': 80, 'Gujarat': 75, 'Bihar': 70, 'West Bengal': 65,
    },
    cropRotationNotes: ['Excellent after rice', 'Good after maize', 'Follow with moong or groundnut'],
    durationDays: [110, 140],
    yieldRange: '3-6 quintals/acre',
    costRange: 'Rs. 15,000-22,000/acre',
    risks: ['Aphid attack', 'Frost damage', 'Sclerotinia rot'],
  },
  {
    name: 'Sugarcane',
    category: 'Cash Crop',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'High',
    growingPeriodDays: '300-360',
    commonDiseases: ['Red rot', 'Wilt', 'Smut', 'Blight'],
    commonPests: ['Borer', 'Pyrilla', 'Mealybug'],
    preferredSoilTypes: ['Clay Loam', 'Alluvial', 'Black'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'High',
    stateSuitability: {
      'Uttar Pradesh': 90, 'Maharashtra': 90, 'Karnataka': 85, 'Tamil Nadu': 85,
      'Andhra Pradesh': 80, 'Telangana': 75, 'Bihar': 75, 'Punjab': 70,
      'Haryana': 70, 'Gujarat': 70,
    },
    cropRotationNotes: ['Long-duration crop - plan carefully', 'Good after pulses', 'Follow with wheat or vegetables'],
    durationDays: [300, 360],
    yieldRange: '25-40 tonnes/acre',
    costRange: 'Rs. 40,000-60,000/acre',
    risks: ['Red rot', 'Long capital lock-in', 'Water intensive'],
  },
  {
    name: 'Onion',
    category: 'Vegetable',
    seasons: ['Rabi', 'Kharif'],
    waterRequirement: 'Medium',
    growingPeriodDays: '110-130',
    commonDiseases: ['Purple blotch', 'Blast', 'Basal rot'],
    commonPests: ['Thrips', 'Bulb fly', 'Cutworm'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.0],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Maharashtra': 90, 'Karnataka': 85, 'Madhya Pradesh': 80, 'Gujarat': 80,
      'Rajasthan': 75, 'Andhra Pradesh': 75, 'Telangana': 70, 'Tamil Nadu': 70,
      'Bihar': 65, 'Uttar Pradesh': 65,
    },
    cropRotationNotes: ['Good after legumes', 'Avoid onion-onion continuous', 'Follow with chilli or tomato'],
    durationDays: [110, 130],
    yieldRange: '8-12 tonnes/acre',
    costRange: 'Rs. 25,000-35,000/acre',
    risks: ['Price volatility', 'Thrips infestation', 'Storage losses'],
  },
  {
    name: 'Tomato',
    category: 'Vegetable',
    seasons: ['Kharif', 'Rabi', 'Zaid'],
    waterRequirement: 'Medium',
    growingPeriodDays: '90-120',
    commonDiseases: ['Early blight', 'Late blight', 'Leaf curl virus', 'Wilt'],
    commonPests: ['Fruit borer', 'Whitefly', 'Aphid', 'Mite'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.0],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Karnataka': 85, 'Maharashtra': 85, 'Andhra Pradesh': 80, 'Telangana': 80,
      'Tamil Nadu': 75, 'Madhya Pradesh': 75, 'Gujarat': 70, 'Odisha': 70,
      'West Bengal': 65, 'Bihar': 65,
    },
    cropRotationNotes: ['Good after legumes', 'Avoid solanaceous crops in succession', 'Follow with leafy vegetables'],
    durationDays: [90, 120],
    yieldRange: '10-15 tonnes/acre',
    costRange: 'Rs. 30,000-40,000/acre',
    risks: ['Blight diseases', 'Price volatility', 'Pest pressure'],
  },
  {
    name: 'Potato',
    category: 'Vegetable',
    seasons: ['Rabi'],
    waterRequirement: 'Medium',
    growingPeriodDays: '90-120',
    commonDiseases: ['Late blight', 'Early blight', 'Black scurf', 'Wilt'],
    commonPests: ['Aphid', 'Whitefly', 'Cutworm', 'Tuber moth'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
    preferredPhRange: [5.0, 6.5],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Uttar Pradesh': 90, 'West Bengal': 85, 'Bihar': 80, 'Punjab': 80,
      'Gujarat': 75, 'Madhya Pradesh': 75, 'Haryana': 70, 'Karnataka': 65,
    },
    cropRotationNotes: ['Good after rice', 'Avoid potato-potato continuous', 'Follow with maize or vegetables'],
    durationDays: [90, 120],
    yieldRange: '10-15 tonnes/acre',
    costRange: 'Rs. 28,000-38,000/acre',
    risks: ['Late blight', 'Price volatility', 'Storage losses'],
  },
  {
    name: 'Chilli',
    category: 'Vegetable',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'Medium',
    growingPeriodDays: '120-150',
    commonDiseases: ['Powdery mildew', 'Leaf spot', 'Fruit rot', 'Mosaic virus'],
    commonPests: ['Thrips', 'Aphid', 'Mite', 'Fruit borer'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Red'],
    preferredPhRange: [6.0, 7.0],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Andhra Pradesh': 90, 'Telangana': 85, 'Karnataka': 80, 'Maharashtra': 80,
      'Tamil Nadu': 75, 'Madhya Pradesh': 70, 'Odisha': 65, 'Gujarat': 65,
    },
    cropRotationNotes: ['Good after legumes', 'Avoid chilli-chilli continuous', 'Follow with groundnut or pulses'],
    durationDays: [120, 150],
    yieldRange: '5-8 quintals/acre (dry)',
    costRange: 'Rs. 25,000-35,000/acre',
    risks: ['Thrips and mite pressure', 'Price volatility', 'Disease susceptibility'],
  },
  {
    name: 'Turmeric',
    category: 'Spice',
    seasons: ['Kharif'],
    waterRequirement: 'Medium',
    growingPeriodDays: '240-270',
    commonDiseases: ['Leaf spot', 'Rhizome rot'],
    commonPests: ['Rhizome fly', 'Scale insect'],
    preferredSoilTypes: ['Loamy', 'Alluvial', 'Red'],
    preferredPhRange: [5.5, 7.0],
    budgetLevel: 'Medium',
    stateSuitability: {
      'Telangana': 90, 'Andhra Pradesh': 85, 'Karnataka': 80, 'Tamil Nadu': 75,
      'Maharashtra': 70, 'Odisha': 65, 'Kerala': 65,
    },
    cropRotationNotes: ['Long-duration crop', 'Good after pulses', 'Avoid continuous turmeric'],
    durationDays: [240, 270],
    yieldRange: '15-25 quintals/acre',
    costRange: 'Rs. 35,000-50,000/acre',
    risks: ['Rhizome rot', 'Long capital lock-in', 'Price volatility'],
  },
  {
    name: 'Bengal Gram (Chana)',
    category: 'Pulse',
    seasons: ['Rabi'],
    waterRequirement: 'Low',
    growingPeriodDays: '100-120',
    commonDiseases: ['Wilt', 'Ascochyta blight', 'Rust'],
    commonPests: ['Pod borer', 'Cutworm', 'Aphid'],
    preferredSoilTypes: ['Loamy', 'Clay Loam', 'Black'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Madhya Pradesh': 90, 'Rajasthan': 85, 'Maharashtra': 85, 'Karnataka': 80,
      'Uttar Pradesh': 80, 'Haryana': 75, 'Gujarat': 75, 'Andhra Pradesh': 70,
      'Telangana': 70, 'Bihar': 65,
    },
    cropRotationNotes: ['Excellent nitrogen fixer', 'Good before cotton or maize', 'Avoid continuous gram'],
    durationDays: [100, 120],
    yieldRange: '3-5 quintals/acre',
    costRange: 'Rs. 12,000-18,000/acre',
    risks: ['Wilt', 'Pod borer', 'Drought stress'],
  },
  {
    name: 'Black Gram (Urad)',
    category: 'Pulse',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'Low',
    growingPeriodDays: '70-90',
    commonDiseases: ['Yellow mosaic virus', 'Wilt', 'Leaf spot'],
    commonPests: ['Aphid', 'Pod borer', 'Whitefly'],
    preferredSoilTypes: ['Loamy', 'Clay Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Madhya Pradesh': 85, 'Uttar Pradesh': 80, 'Maharashtra': 80, 'Andhra Pradesh': 75,
      'Telangana': 75, 'Tamil Nadu': 70, 'Karnataka': 70, 'Rajasthan': 65,
    },
    cropRotationNotes: ['Excellent nitrogen fixer', 'Good before wheat or rice', 'Avoid continuous urad'],
    durationDays: [70, 90],
    yieldRange: '2-4 quintals/acre',
    costRange: 'Rs. 10,000-15,000/acre',
    risks: ['Yellow mosaic virus', 'Pod borer', 'Drought stress'],
  },
  {
    name: 'Green Gram (Moong)',
    category: 'Pulse',
    seasons: ['Kharif', 'Rabi', 'Zaid'],
    waterRequirement: 'Low',
    growingPeriodDays: '60-75',
    commonDiseases: ['Yellow mosaic virus', 'Leaf spot', 'Powdery mildew'],
    commonPests: ['Aphid', 'Whitefly', 'Pod borer'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Rajasthan': 85, 'Madhya Pradesh': 80, 'Maharashtra': 80, 'Uttar Pradesh': 75,
      'Andhra Pradesh': 75, 'Telangana': 75, 'Karnataka': 70, 'Gujarat': 70,
      'Tamil Nadu': 65, 'Bihar': 65,
    },
    cropRotationNotes: ['Excellent nitrogen fixer', 'Short duration - good for rotation', 'Good before wheat or rice'],
    durationDays: [60, 75],
    yieldRange: '2-3 quintals/acre',
    costRange: 'Rs. 8,000-12,000/acre',
    risks: ['Yellow mosaic virus', 'Pod borer', 'Drought stress'],
  },
  {
    name: 'Jowar (Sorghum)',
    category: 'Cereal',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'Low',
    growingPeriodDays: '100-120',
    commonDiseases: ['Grain mold', 'Leaf blight', 'Rust'],
    commonPests: ['Shoot fly', 'Stem borer', 'Aphid'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Black'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Maharashtra': 90, 'Karnataka': 85, 'Telangana': 80, 'Andhra Pradesh': 75,
      'Madhya Pradesh': 75, 'Rajasthan': 70, 'Gujarat': 65, 'Tamil Nadu': 65,
    },
    cropRotationNotes: ['Drought-tolerant', 'Good after pulses', 'Follow with gram or mustard'],
    durationDays: [100, 120],
    yieldRange: '2-3 tonnes/acre',
    costRange: 'Rs. 15,000-22,000/acre',
    risks: ['Shoot fly', 'Grain mold', 'Drought stress'],
  },
  {
    name: 'Bajra (Pearl Millet)',
    category: 'Cereal',
    seasons: ['Kharif'],
    waterRequirement: 'Low',
    growingPeriodDays: '80-90',
    commonDiseases: ['Downy mildew', 'Ergot', 'Smut'],
    commonPests: ['Shoot fly', 'Stem borer'],
    preferredSoilTypes: ['Sandy', 'Sandy Loam', 'Red'],
    preferredPhRange: [6.0, 8.0],
    budgetLevel: 'Low',
    stateSuitability: {
      'Rajasthan': 90, 'Gujarat': 85, 'Haryana': 80, 'Maharashtra': 75,
      'Uttar Pradesh': 70, 'Madhya Pradesh': 65, 'Karnataka': 65,
    },
    cropRotationNotes: ['Very drought-tolerant', 'Good after pulses', 'Follow with mustard or gram'],
    durationDays: [80, 90],
    yieldRange: '1.5-2.5 tonnes/acre',
    costRange: 'Rs. 12,000-18,000/acre',
    risks: ['Downy mildew', 'Ergot', 'Drought stress'],
  },
  {
    name: 'Ragi (Finger Millet)',
    category: 'Cereal',
    seasons: ['Kharif'],
    waterRequirement: 'Low',
    growingPeriodDays: '110-130',
    commonDiseases: ['Blast', 'Leaf spot'],
    commonPests: ['Stem borer', 'Aphid'],
    preferredSoilTypes: ['Red', 'Sandy Loam', 'Loamy'],
    preferredPhRange: [5.0, 7.0],
    budgetLevel: 'Low',
    stateSuitability: {
      'Karnataka': 90, 'Tamil Nadu': 80, 'Andhra Pradesh': 75, 'Telangana': 70,
      'Maharashtra': 65, 'Odisha': 60,
    },
    cropRotationNotes: ['Drought-tolerant', 'Good after pulses', 'Follow with groundnut or pulses'],
    durationDays: [110, 130],
    yieldRange: '1.5-2.5 tonnes/acre',
    costRange: 'Rs. 12,000-18,000/acre',
    risks: ['Blast', 'Drought stress'],
  },
  {
    name: 'Banana',
    category: 'Fruit',
    seasons: ['Kharif', 'Rabi'],
    waterRequirement: 'High',
    growingPeriodDays: '300-360',
    commonDiseases: ['Panama wilt', 'Sigatoka leaf spot', 'Bunchy top virus'],
    commonPests: ['Rhizome weevil', 'Aphid', 'Thrips'],
    preferredSoilTypes: ['Loamy', 'Alluvial', 'Clay Loam'],
    preferredPhRange: [5.5, 7.0],
    budgetLevel: 'High',
    stateSuitability: {
      'Tamil Nadu': 90, 'Maharashtra': 85, 'Karnataka': 85, 'Andhra Pradesh': 80,
      'Gujarat': 75, 'Telangana': 70, 'Kerala': 70, 'Madhya Pradesh': 65,
    },
    cropRotationNotes: ['Long-duration crop', 'Requires good irrigation', 'Avoid banana-banana continuous'],
    durationDays: [300, 360],
    yieldRange: '20-30 tonnes/acre',
    costRange: 'Rs. 50,000-70,000/acre',
    risks: ['Panama wilt', 'High capital requirement', 'Wind damage'],
  },
  {
    name: 'Mango',
    category: 'Fruit',
    seasons: ['Kharif'],
    waterRequirement: 'Low',
    growingPeriodDays: 'Perennial',
    commonDiseases: ['Anthracnose', 'Powdery mildew', 'Dieback'],
    commonPests: ['Mango hopper', 'Fruit fly', 'Stem borer'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Red'],
    preferredPhRange: [5.5, 7.5],
    budgetLevel: 'High',
    stateSuitability: {
      'Uttar Pradesh': 90, 'Andhra Pradesh': 85, 'Telangana': 80, 'Karnataka': 80,
      'Maharashtra': 80, 'Gujarat': 75, 'Tamil Nadu': 75, 'Bihar': 70,
      'West Bengal': 65, 'Odisha': 65,
    },
    cropRotationNotes: ['Perennial - long-term investment', 'Good for orchard establishment', 'Intercrop with pulses in early years'],
    durationDays: [365, 365],
    yieldRange: '5-10 tonnes/acre (mature trees)',
    costRange: 'Rs. 60,000-100,000/acre (establishment)',
    risks: ['Long payback period', 'Fruit fly', 'Climate variability'],
  },
  {
    name: 'Sunflower',
    category: 'Oilseed',
    seasons: ['Kharif', 'Rabi', 'Zaid'],
    waterRequirement: 'Low',
    growingPeriodDays: '90-110',
    commonDiseases: ['Rust', 'Alternaria leaf spot', 'Downy mildew'],
    commonPests: ['Aphid', 'Capitulum borer', 'Leaf eater'],
    preferredSoilTypes: ['Loamy', 'Sandy Loam', 'Black'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Karnataka': 85, 'Maharashtra': 80, 'Andhra Pradesh': 75, 'Telangana': 70,
      'Tamil Nadu': 70, 'Madhya Pradesh': 65, 'Rajasthan': 60,
    },
    cropRotationNotes: ['Short duration', 'Good after pulses', 'Follow with wheat or gram'],
    durationDays: [90, 110],
    yieldRange: '3-5 quintals/acre',
    costRange: 'Rs. 12,000-18,000/acre',
    risks: ['Aphid attack', 'Birds', 'Price volatility'],
  },
  {
    name: 'Sesame',
    category: 'Oilseed',
    seasons: ['Kharif', 'Zaid'],
    waterRequirement: 'Low',
    growingPeriodDays: '80-100',
    commonDiseases: ['Leaf spot', 'Wilt', 'Stem rot'],
    commonPests: ['Aphid', 'Gall midge', 'Leaf roller'],
    preferredSoilTypes: ['Sandy', 'Sandy Loam', 'Red'],
    preferredPhRange: [5.5, 7.0],
    budgetLevel: 'Low',
    stateSuitability: {
      'Rajasthan': 85, 'Gujarat': 80, 'Madhya Pradesh': 75, 'Uttar Pradesh': 70,
      'Maharashtra': 70, 'Telangana': 65, 'Karnataka': 65, 'Tamil Nadu': 60,
    },
    cropRotationNotes: ['Short duration', 'Good after pulses', 'Follow with wheat or gram'],
    durationDays: [80, 100],
    yieldRange: '2-3 quintals/acre',
    costRange: 'Rs. 10,000-15,000/acre',
    risks: ['Aphid attack', 'Drought stress', 'Price volatility'],
  },
  {
    name: 'Lentil (Masoor)',
    category: 'Pulse',
    seasons: ['Rabi'],
    waterRequirement: 'Low',
    growingPeriodDays: '100-110',
    commonDiseases: ['Wilt', 'Rust', 'Stemphylium blight'],
    commonPests: ['Aphid', 'Pod borer'],
    preferredSoilTypes: ['Loamy', 'Clay Loam', 'Alluvial'],
    preferredPhRange: [6.0, 7.5],
    budgetLevel: 'Low',
    stateSuitability: {
      'Uttar Pradesh': 85, 'Madhya Pradesh': 80, 'Bihar': 75, 'West Bengal': 70,
      'Rajasthan': 70, 'Haryana': 65, 'Punjab': 60,
    },
    cropRotationNotes: ['Excellent nitrogen fixer', 'Good before rice or wheat', 'Avoid continuous lentil'],
    durationDays: [100, 110],
    yieldRange: '2-3 quintals/acre',
    costRange: 'Rs. 10,000-15,000/acre',
    risks: ['Wilt', 'Aphid attack', 'Drought stress'],
  },
];

// State-level crop suitability adjustments based on published ICAR/state data
const STATE_CROP_NOTES: Record<string, string> = {
  'Andhra Pradesh': 'Coastal Andhra is suitable for rice, chilli, cotton, and groundnut. Rayalaseema is drier - pulses and groundnut do well.',
  'Telangana': 'Good for cotton, rice, chilli, turmeric, and pulses. Black cotton soils in parts support cotton well.',
  'Maharashtra': 'Diverse agro-climatic zones. Cotton, soybean, pigeon pea, and sugarcane are major crops.',
  'Karnataka': 'Good for ragi, maize, groundnut, sunflower, and pulses. Northern Karnataka is good for cotton.',
  'Tamil Nadu': 'Rice, sugarcane, banana, and groundnut are major crops. Cauvery delta is ideal for rice.',
  'Uttar Pradesh': 'Wheat, rice, sugarcane, potato, and pulses are major crops. Western UP is good for wheat and sugarcane.',
  'Madhya Pradesh': 'Soybean, wheat, gram, and pulses are major crops. Good black soil for soybean.',
  'Punjab': 'Wheat-rice rotation is dominant. Good irrigation infrastructure.',
  'Haryana': 'Wheat, rice, mustard, and cotton are major crops. Good irrigation infrastructure.',
  'Gujarat': 'Groundnut, cotton, bajra, and mustard are major crops. Saurashtra is good for groundnut.',
  'Rajasthan': 'Bajra, mustard, gram, and pulses are major crops. Arid climate - drought-tolerant crops preferred.',
  'West Bengal': 'Rice is the dominant crop. Good for potato, jute, and vegetables.',
  'Bihar': 'Rice, wheat, maize, and pulses are major crops. Good alluvial soils.',
  'Odisha': 'Rice is dominant. Good for pulses and vegetables in rabi.',
  'Kerala': 'Rice, coconut, banana, and spices. High rainfall area.',
  'Assam': 'Rice is dominant. Good for tea and horticulture.',
  'Chhattisgarh': 'Rice is dominant. Good for pulses and oilseeds in rabi.',
  'Jharkhand': 'Rice, maize, and pulses. Good for vegetables in rabi.',
  'Uttarakhand': 'Wheat, rice, and horticulture. Hill agriculture.',
  'Himachal Pradesh': 'Horticulture, wheat, and maize. Hill agriculture.',
  'Jammu & Kashmir': 'Rice, maize, and horticulture. Cold climate.',
  'Goa': 'Rice, coconut, and cashew. Coastal agriculture.',
  'Tripura': 'Rice, rubber, and horticulture.',
  'Manipur': 'Rice and horticulture.',
  'Meghalaya': 'Rice, maize, and horticulture.',
  'Nagaland': 'Rice, maize, and horticulture.',
  'Mizoram': 'Rice and horticulture.',
  'Arunachal Pradesh': 'Rice, maize, and horticulture.',
  'Sikkim': 'Organic farming, horticulture, and maize.',
};

// Map water availability input to water requirement levels
function normalizeWaterInput(water: string): 'Low' | 'Medium' | 'High' | null {
  const w = water.toLowerCase();
  if (['low', 'rainfed', 'limited'].includes(w)) return 'Low';
  if (['moderate', 'irrigated'].includes(w)) return 'Medium';
  if (['high'].includes(w)) return 'High';
  return null;
}

// Map budget input to budget level
function normalizeBudgetInput(budget: string): 'Low' | 'Medium' | 'High' | null {
  const b = budget.toLowerCase();
  if (['low'].includes(b)) return 'Low';
  if (['medium'].includes(b)) return 'Medium';
  if (['high'].includes(b)) return 'High';
  return null;
}

// Determine effective season
function resolveSeason(season: string): 'Kharif' | 'Rabi' | 'Zaid' | null {
  if (season === 'auto' || season === '') {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 11) return 'Kharif';
    if (month >= 11 || month <= 3) return 'Rabi';
    return 'Zaid';
  }
  if (season === 'kharif') return 'Kharif';
  if (season === 'rabi') return 'Rabi';
  if (season === 'zaid') return 'Zaid';
  return null;
}

// Check if a crop is suitable for the given season
function cropMatchesSeason(crop: CropProfile, season: string | null): boolean {
  if (!season) return true;
  return crop.seasons.includes(season);
}

// Score a crop based on all inputs
function scoreCrop(
  crop: CropProfile,
  input: RecommendationInput,
  effectiveSeason: 'Kharif' | 'Rabi' | 'Zaid' | null,
): { score: number; factors: ScoreFactor[]; missingInputs: string[] } {
  const factors: ScoreFactor[] = [];
  const missingInputs: string[] = [];
  let totalScore = 0;

  // 1. Season suitability (max 25 points)
  const seasonScore = cropMatchesSeason(crop, effectiveSeason) ? 25 : 5;
  factors.push({
    factor: 'Season',
    score: seasonScore,
    maxScore: 25,
    reason: cropMatchesSeason(crop, effectiveSeason)
      ? `${crop.name} is suitable for ${effectiveSeason || 'multiple'} season`
      : `${crop.name} is not ideal for ${effectiveSeason || 'the current'} season`,
  });
  totalScore += seasonScore;

  // 2. Water availability (max 20 points)
  const waterLevel = normalizeWaterInput(input.waterAvailability);
  if (waterLevel) {
    let waterScore = 0;
    if (waterLevel === crop.waterRequirement) {
      waterScore = 20;
    } else if (
      (waterLevel === 'High' && crop.waterRequirement === 'Medium') ||
      (waterLevel === 'Medium' && crop.waterRequirement === 'Low')
    ) {
      waterScore = 15;
    } else if (
      (waterLevel === 'Low' && crop.waterRequirement === 'Medium') ||
      (waterLevel === 'Medium' && crop.waterRequirement === 'High')
    ) {
      waterScore = 8;
    } else if (waterLevel === 'Low' && crop.waterRequirement === 'High') {
      waterScore = 3;
    } else {
      waterScore = 10;
    }
    factors.push({
      factor: 'Water Availability',
      score: waterScore,
      maxScore: 20,
      reason: `Your water availability (${waterLevel}) vs ${crop.name} requirement (${crop.waterRequirement})`,
    });
    totalScore += waterScore;
  } else {
    missingInputs.push('water');
    factors.push({
      factor: 'Water Availability',
      score: 10,
      maxScore: 20,
      reason: 'Water availability not specified - neutral score applied',
    });
    totalScore += 10;
  }

  // 3. Budget (max 15 points)
  const budgetLevel = normalizeBudgetInput(input.budget);
  if (budgetLevel) {
    let budgetScore = 0;
    if (budgetLevel === crop.budgetLevel) {
      budgetScore = 15;
    } else if (
      (budgetLevel === 'High' && crop.budgetLevel === 'Medium') ||
      (budgetLevel === 'Medium' && crop.budgetLevel === 'Low')
    ) {
      budgetScore = 10;
    } else if (
      (budgetLevel === 'Low' && crop.budgetLevel === 'Medium') ||
      (budgetLevel === 'Medium' && crop.budgetLevel === 'High')
    ) {
      budgetScore = 6;
    } else if (budgetLevel === 'Low' && crop.budgetLevel === 'High') {
      budgetScore = 2;
    } else {
      budgetScore = 8;
    }
    factors.push({
      factor: 'Budget',
      score: budgetScore,
      maxScore: 15,
      reason: `Your budget (${budgetLevel}) vs ${crop.name} estimated cost (${crop.costRange})`,
    });
    totalScore += budgetScore;
  } else {
    missingInputs.push('budget');
    factors.push({
      factor: 'Budget',
      score: 8,
      maxScore: 15,
      reason: 'Budget not specified - neutral score applied',
    });
    totalScore += 8;
  }

  // 4. State/location suitability (max 15 points)
  if (input.state) {
    const stateScore = crop.stateSuitability[input.state] ?? 50;
    const normalizedStateScore = Math.round((stateScore / 100) * 15);
    factors.push({
      factor: 'State/Location',
      score: normalizedStateScore,
      maxScore: 15,
      reason: `${crop.name} has ${stateScore}% suitability rating for ${input.state}`,
    });
    totalScore += normalizedStateScore;
  } else {
    missingInputs.push('state');
    factors.push({
      factor: 'State/Location',
      score: 8,
      maxScore: 15,
      reason: 'State not specified - neutral score applied',
    });
    totalScore += 8;
  }

  // 5. Soil type (max 10 points)
  if (input.soilType) {
    const soilMatch = crop.preferredSoilTypes.some(t =>
      input.soilType!.toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes(input.soilType!.toLowerCase()),
    );
    const soilScore = soilMatch ? 10 : 4;
    factors.push({
      factor: 'Soil Type',
      score: soilScore,
      maxScore: 10,
      reason: soilMatch
        ? `${crop.name} prefers ${crop.preferredSoilTypes.join(', ')} - your soil type (${input.soilType}) matches`
        : `${crop.name} prefers ${crop.preferredSoilTypes.join(', ')} - your soil type (${input.soilType}) may not be ideal`,
    });
    totalScore += soilScore;
  } else {
    missingInputs.push('soilType');
    factors.push({
      factor: 'Soil Type',
      score: 5,
      maxScore: 10,
      reason: 'Soil type not specified - neutral score applied',
    });
    totalScore += 5;
  }

  // 6. Soil pH (max 10 points)
  if (input.soilPh !== null && input.soilPh !== undefined) {
    const [minPh, maxPh] = crop.preferredPhRange;
    const phInRange = input.soilPh >= minPh && input.soilPh <= maxPh;
    const phClose = input.soilPh >= minPh - 0.5 && input.soilPh <= maxPh + 0.5;
    const phScore = phInRange ? 10 : phClose ? 6 : 2;
    factors.push({
      factor: 'Soil pH',
      score: phScore,
      maxScore: 10,
      reason: phInRange
        ? `Your soil pH (${input.soilPh}) is within ${crop.name}'s preferred range (${minPh}-${maxPh})`
        : phClose
          ? `Your soil pH (${input.soilPh}) is close to ${crop.name}'s preferred range (${minPh}-${maxPh})`
          : `Your soil pH (${input.soilPh}) is outside ${crop.name}'s preferred range (${minPh}-${maxPh})`,
    });
    totalScore += phScore;
  } else {
    missingInputs.push('soilPh');
    factors.push({
      factor: 'Soil pH',
      score: 5,
      maxScore: 10,
      reason: 'Soil pH not specified - neutral score applied',
    });
    totalScore += 5;
  }

  // 7. Crop preference (max 5 points)
  if (input.cropPreference) {
    const prefMatch = input.cropPreference.toLowerCase().includes(crop.name.toLowerCase().split(' ')[0].toLowerCase()) ||
      crop.name.toLowerCase().includes(input.cropPreference.toLowerCase());
    const prefScore = prefMatch ? 5 : 2;
    factors.push({
      factor: 'Crop Preference',
      score: prefScore,
      maxScore: 5,
      reason: prefMatch
        ? `You expressed interest in ${input.cropPreference} - ${crop.name} matches`
        : `You expressed interest in ${input.cropPreference} - ${crop.name} is different`,
    });
    totalScore += prefScore;
  } else {
    factors.push({
      factor: 'Crop Preference',
      score: 3,
      maxScore: 5,
      reason: 'No specific crop preference provided - neutral score applied',
    });
    totalScore += 3;
  }

  // 8. Previous crop / crop rotation (max 5 points)
  if (input.previousCrop) {
    const prevLower = input.previousCrop.toLowerCase();
    const isLegume = ['gram', 'pulse', 'moong', 'urad', 'lentil', 'pea', 'bean', 'groundnut', 'soybean', 'pigeon'].some(k => prevLower.includes(k));
    const isSameCrop = prevLower.includes(crop.name.toLowerCase().split(' ')[0].toLowerCase());
    let rotationScore = 0;
    let rotationReason = '';
    if (isSameCrop) {
      rotationScore = 1;
      rotationReason = `Growing ${crop.name} after ${input.previousCrop} may increase disease and pest pressure`;
    } else if (isLegume) {
      rotationScore = 5;
      rotationReason = `${input.previousCrop} is a legume - it fixes nitrogen, benefiting ${crop.name}`;
    } else {
      rotationScore = 3;
      rotationReason = `${input.previousCrop} is different from ${crop.name} - acceptable rotation`;
    }
    factors.push({
      factor: 'Crop Rotation',
      score: rotationScore,
      maxScore: 5,
      reason: rotationReason,
    });
    totalScore += rotationScore;
  } else {
    factors.push({
      factor: 'Crop Rotation',
      score: 3,
      maxScore: 5,
      reason: 'Previous crop not specified - neutral score applied',
    });
    totalScore += 3;
  }

  return { score: totalScore, factors, missingInputs };
}

// Build the "why" explanation from score factors
function buildWhyExplanation(crop: CropProfile, factors: ScoreFactor[], effectiveSeason: string | null): string {
  const topFactors = [...factors].sort((a, b) => b.score - a.score).slice(0, 3);
  const reasons = topFactors.map(f => f.reason);
  const seasonNote = effectiveSeason ? `Best suited for ${effectiveSeason} season.` : '';
  return `${seasonNote} ${reasons.join('. ')}.`;
}

export function getCropRecommendations(input: RecommendationInput): RecommendationResult {
  const now = new Date();
  const effectiveSeason = resolveSeason(input.season);
  const missingInputs = new Set<string>();

  // Score all crops
  const scored = CROP_PROFILES.map(crop => {
    const { score, factors, missingInputs: cropMissing } = scoreCrop(crop, input, effectiveSeason);
    cropMissing.forEach(m => missingInputs.add(m));
    return { crop, score, factors };
  });

  // Sort by score descending (NOT a fixed ordering)
  const sorted = scored.sort((a, b) => b.score - a.score);

  // Build recommendations
  const recommendations: CropRecommendation[] = sorted.map(({ crop, score, factors }) => {
    const why = buildWhyExplanation(crop, factors, effectiveSeason);
    const stateNote = input.state && STATE_CROP_NOTES[input.state]
      ? ` ${STATE_CROP_NOTES[input.state]}`
      : '';

    return {
      crop: crop.name,
      suitability: Math.min(100, Math.max(5, Math.round(score))),
      why: why + stateNote,
      season: crop.seasons.join(', '),
      duration: crop.growingPeriodDays,
      waterRequirement: crop.waterRequirement,
      expectedYieldRange: crop.yieldRange,
      estimatedCost: crop.costRange,
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: crop.risks,
      commonDiseases: crop.commonDiseases,
      scoreBreakdown: factors,
      missingInputs: [...new Set(factors.filter(f => f.score === 0 && f.maxScore > 0).map(f => f.factor))],
    };
  });

  // Filter out very low suitability crops (below 30)
  const filtered = recommendations.filter(r => r.suitability >= 30);

  const inputSummary: Record<string, string> = {
    state: input.state || 'Not specified',
    district: input.district || 'Not specified',
    season: effectiveSeason || 'Auto-detected',
    water: input.waterAvailability || 'Not specified',
    budget: input.budget || 'Not specified',
    soilType: input.soilType || 'Not specified',
    soilPh: input.soilPh !== null ? String(input.soilPh) : 'Not specified',
    cropPreference: input.cropPreference || 'Not specified',
    previousCrop: input.previousCrop || 'Not specified',
  };

  return {
    recommendations: filtered,
    source: {
      sourceName: input.hasSoilData
        ? 'AI Crop Recommendation (with soil data)'
        : 'AI Crop Recommendation (location-based, no soil data)',
      sourceType: 'AI',
      isLive: false,
      isVerified: false,
      lastUpdated: formatLastUpdated(now),
      status: 'available',
    },
    hasSoilData: input.hasSoilData,
    missingInputs: [...missingInputs],
    inputSummary,
  };
}

// Backward-compatible wrapper for existing callers
export function getCropRecommendationsLegacy(
  state: string,
  season: string,
  waterAvailable: string,
  budget: string,
  soilData: boolean,
): RecommendationResult {
  return getCropRecommendations({
    state,
    district: '',
    season: season as RecommendationInput['season'],
    waterAvailability: waterAvailable as RecommendationInput['waterAvailability'],
    budget: budget as RecommendationInput['budget'],
    soilType: null,
    soilPh: null,
    cropPreference: null,
    previousCrop: null,
    hasSoilData: soilData,
  });
}

export function isKharifSeason(): boolean {
  const month = new Date().getMonth() + 1;
  return month >= 6 && month <= 11;
}