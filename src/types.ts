export type DataStatus = 'live' | 'verified' | 'ai' | 'estimate' | 'demo' | 'low' | 'unavailable';

export interface SourceMetadata {
  sourceName: string;
  sourceUrl?: string;
  sourceType: 'OFFICIAL' | 'FALLBACK' | 'AI' | 'DEMO' | 'VERIFIED';
  isLive: boolean;
  isVerified: boolean;
  lastUpdated: string;
  status: 'available' | 'unavailable' | 'partial';
}

export interface MarketPrice {
  commodity: string;
  market: string;
  state: string;
  district: string;
  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;
  arrivals: string | null;
  date: string;
}

export interface MarketForecastPoint {
  day: number;
  date: string;
  value: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: 'High' | 'Moderate' | 'Lower';
}

export interface WeatherData {
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  rainfall: number | null;
  rainProbability: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  condition: string;
  source: 'IMD' | 'Open-Meteo' | 'DEMO';
  lastUpdated: string;
}

export interface WeatherForecastDay {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  rainProbability: number | null;
  condition: string;
}

export interface WeatherWarning {
  id: string;
  level: 'RED' | 'ORANGE' | 'YELLOW' | 'INFORMATION';
  title: string;
  area: string;
  issueTime: string;
  validUntil: string;
  source: string;
  actions: string[];
}

export interface CropHealthResult {
  crop: string;
  possibleProblem: string;
  confidence: 'High' | 'Medium' | 'Low';
  severity: string;
  visibleSymptoms: string[];
  possibleCauses: string[];
  whatToDoNow: string[];
  prevention: string[];
  monitor: string[];
  sources: string[];
}

export interface GovernmentScheme {
  name: string;
  level: 'Central' | 'State' | 'District';
  eligibility: string;
  benefits: string;
  documents: string[];
  applicationMethod: string;
  applicationLink: string;
  deadline: string | null;
  status: string | null;
  source: string;
  lastChecked: string;
  eligibilityLabel: 'eligible' | 'info-required' | 'possibly-eligible' | 'not-eligible';
}

export interface SupportCenter {
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  distance: number | null;
  website: string | null;
  source: string;
  lastVerified: string;
}

export interface SoilTestData {
  ph: number | null;
  nitrogen: string | null;
  phosphorus: string | null;
  potassium: string | null;
  organicCarbon: string | null;
  micronutrients: string | null;
  soilType: string | null;
}

export interface CropRecommendation {
  crop: string;
  suitability: number;
  why: string;
  season: string;
  duration: string;
  waterRequirement: string;
  expectedYieldRange: string;
  estimatedCost: string;
  currentMarketPrice: string | null;
  marketTrend: string | null;
  aiForecast: string | null;
  mainRisks: string[];
  commonDiseases: string[];
  scoreBreakdown?: ScoreFactor[];
  missingInputs?: string[];
}

export interface ScoreFactor {
  factor: string;
  score: number;
  maxScore: number;
  reason: string;
}

export interface RecommendationInput {
  state: string;
  district: string;
  season: 'kharif' | 'rabi' | 'zaid' | 'auto' | '';
  waterAvailability: 'low' | 'moderate' | 'high' | 'rainfed' | 'irrigated' | 'limited' | '';
  budget: 'low' | 'medium' | 'high' | '';
  soilType: string | null;
  soilPh: number | null;
  cropPreference: string | null;
  previousCrop: string | null;
  hasSoilData: boolean;
}

export interface FarmEconomicsResult {
  totalCost: number;
  expectedRevenue: number;
  estimatedProfit: number;
  costBreakdown: { label: string; amount: number }[];
}

export interface AIResponse {
  text: string;
  confidence: 'High' | 'Medium' | 'Low' | null;
  dataStatus: DataStatus;
  sources: SourceMetadata[];
  actions: { label: string; link?: string; action?: string }[];
}

export interface LocationInfo {
  latitude: number | null;
  longitude: number | null;
  country: string;
  state: string;
  district: string;
  city: string;
  village: string | null;
  pincode: string | null;
  source: 'gps' | 'manual' | 'fallback';
  /** Epoch ms when this location was detected. Used to detect stale data. */
  detectedAt?: number;
}

export interface FarmerDetails {
  name: string;
  phone: string;
  landArea: string;
  landUnit: 'acres' | 'hectares';
  crop: string;
  waterAvailability: 'rainfed' | 'irrigated' | 'limited' | 'other' | '';
  season: 'kharif' | 'rabi' | 'zaid' | '';
  hasSoilTest: 'yes' | 'no' | '';
  budget: string;
  fpoMembership: 'yes' | 'no' | 'dont-know' | '';
  experience: string;
}

export interface SourceInfo {
  name: string;
  url: string;
  type: 'OFFICIAL' | 'FALLBACK' | 'AI' | 'DEMO' | 'VERIFIED';
}
