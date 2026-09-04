import type { CropRecommendation, SourceMetadata } from '@/types';
import { formatLastUpdated } from './sourceMetadata';

export interface RecommendationResult {
  recommendations: CropRecommendation[];
  source: SourceMetadata;
  hasSoilData: boolean;
}

export function getCropRecommendations(
  state: string,
  season: string,
  waterAvailable: string,
  budget: string,
  soilData: boolean,
): RecommendationResult {
  const now = new Date();

  const isKharif = season === 'kharif' || (season === 'auto' && isKharifSeason());
  const waterLow = waterAvailable === 'low';
  const waterHigh = waterAvailable === 'high';

  const allCrops: CropRecommendation[] = [
    {
      crop: 'Rice (Paddy)',
      suitability: waterHigh ? 90 : waterLow ? 40 : 70,
      why: waterHigh ? 'Good water availability suits rice cultivation' : 'Rice requires significant water. Consider if irrigation is reliable.',
      season: 'Kharif',
      duration: '120-150 days',
      waterRequirement: 'High (1200-1500 mm)',
      expectedYieldRange: '2-4 tonnes/acre',
      estimatedCost: 'Rs. 25,000-35,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Water stress', 'Pest infestation', 'Climate variability'],
      commonDiseases: ['Blast', 'Bacterial blight', 'Sheath rot'],
    },
    {
      crop: 'Cotton',
      suitability: isKharif ? (waterLow ? 75 : 65) : 30,
      why: isKharif ? 'Suitable for kharif season with moderate water needs' : 'Cotton is primarily a kharif crop',
      season: 'Kharif',
      duration: '150-180 days',
      waterRequirement: 'Moderate (500-700 mm)',
      expectedYieldRange: '1.5-3 quintals/acre',
      estimatedCost: 'Rs. 30,000-45,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Bollworm attack', 'Price volatility', 'Weather sensitivity'],
      commonDiseases: ['Bollworm', 'Leaf curl virus', 'Wilt'],
    },
    {
      crop: 'Maize',
      suitability: isKharif ? 80 : 60,
      why: 'Versatile crop with moderate water requirements, suitable for multiple seasons',
      season: isKharif ? 'Kharif' : 'Rabi/Spring',
      duration: '90-120 days',
      waterRequirement: 'Moderate (500-800 mm)',
      expectedYieldRange: '2-3.5 tonnes/acre',
      estimatedCost: 'Rs. 20,000-28,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Fall armyworm', 'Drought stress', 'Stalk rot'],
      commonDiseases: ['Fall armyworm', 'Stalk rot', 'Leaf blight'],
    },
    {
      crop: 'Pigeon Pea (Tur/Arhar)',
      suitability: isKharif ? 85 : 40,
      why: isKharif ? 'Excellent kharif pulse crop with good market demand and relatively low input cost' : 'Primarily a kharif crop',
      season: 'Kharif',
      duration: '150-210 days',
      waterRequirement: 'Low to Moderate (300-500 mm)',
      expectedYieldRange: '2-4 quintals/acre',
      estimatedCost: 'Rs. 12,000-18,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Pod borer', 'Wilt disease', 'Flowering-stage stress'],
      commonDiseases: ['Pod borer', 'Wilt', 'Sterility mosaic'],
    },
    {
      crop: 'Groundnut',
      suitability: isKharif ? (waterLow ? 80 : 70) : 30,
      why: isKharif ? 'Good for kharif, drought-tolerant crop suitable for lighter soils' : 'Primarily a kharif crop',
      season: 'Kharif',
      duration: '100-130 days',
      waterRequirement: 'Low to Moderate (300-500 mm)',
      expectedYieldRange: '4-8 quintals/acre',
      estimatedCost: 'Rs. 18,000-25,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Tikka leaf spot', 'Aflatoxin', 'Drought at pod formation'],
      commonDiseases: ['Tikka leaf spot', 'Aflatoxin contamination', 'Root rot'],
    },
    {
      crop: 'Wheat',
      suitability: !isKharif ? (waterHigh ? 85 : 60) : 20,
      why: !isKharif ? 'Ideal rabi crop with good irrigation support' : 'Wheat is a rabi crop, not suitable for kharif season',
      season: 'Rabi',
      duration: '120-150 days',
      waterRequirement: 'Moderate (400-600 mm)',
      expectedYieldRange: '2.5-4 tonnes/acre',
      estimatedCost: 'Rs. 22,000-30,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Terminal heat stress', 'Rust diseases', 'Water scarcity'],
      commonDiseases: ['Rust (yellow/brown)', 'Karnal bunt', 'Loose smut'],
    },
    {
      crop: 'Mustard',
      suitability: !isKharif ? (waterLow ? 80 : 70) : 20,
      why: !isKharif ? 'Good rabi oilseed crop with lower water requirement' : 'Mustard is a rabi crop',
      season: 'Rabi',
      duration: '110-140 days',
      waterRequirement: 'Low to Moderate (250-400 mm)',
      expectedYieldRange: '3-6 quintals/acre',
      estimatedCost: 'Rs. 15,000-22,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Aphid attack', 'Frost damage', 'Sclerotinia rot'],
      commonDiseases: ['Aphids', 'White rust', 'Alternaria blight'],
    },
    {
      crop: 'Soybean',
      suitability: isKharif ? (waterLow ? 70 : 80) : 25,
      why: isKharif ? 'Excellent kharif oilseed and protein crop with good market demand' : 'Soybean is primarily a kharif crop',
      season: 'Kharif',
      duration: '90-120 days',
      waterRequirement: 'Moderate (450-700 mm)',
      expectedYieldRange: '3-5 quintals/acre',
      estimatedCost: 'Rs. 16,000-24,000/acre',
      currentMarketPrice: null,
      marketTrend: null,
      aiForecast: null,
      mainRisks: ['Yellow mosaic virus', 'Sudden death syndrome', 'Waterlogging'],
      commonDiseases: ['Yellow mosaic virus', 'Rhizoctonia root rot', 'Soybean rust'],
    },
  ];

  // Filter and sort by suitability
  const filtered = allCrops
    .filter(c => c.suitability >= 30)
    .sort((a, b) => b.suitability - a.suitability);

  void state;
  void budget;

  return {
    recommendations: filtered,
    source: {
      sourceName: soilData ? 'AI Crop Recommendation (with soil data)' : 'AI Crop Recommendation (location-based, no soil data)',
      sourceType: 'AI',
      isLive: false,
      isVerified: false,
      lastUpdated: formatLastUpdated(now),
      status: 'available',
    },
    hasSoilData: soilData,
  };
}

function isKharifSeason(): boolean {
  const month = new Date().getMonth() + 1; // 1-12
  return month >= 6 && month <= 11;
}
