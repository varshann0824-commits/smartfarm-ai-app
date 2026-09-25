import type { FarmerDetails, SoilTestData, WeatherData, WeatherForecastDay, WeatherWarning } from '@/types';
import { fetchCropAnalyses, type CropAnalysisRecord } from './analysisHistoryService';
import { fetchFarmTasks, type FarmTask } from './farmTaskService';
import { getCropCalendar } from './agricultureKnowledgeService';
import { getCropInfo } from './cropDatabase';
import { loadSoilTest } from './soilService';
import { readLatestLiveSensorData, type LiveSensorData } from './sensorIngestionService';
import { fetchWeather } from './weatherService';

export type RiskLevel = 'unknown' | 'low' | 'moderate' | 'high' | 'severe';

export const RISK_LABEL: Record<RiskLevel, string> = {
  unknown: 'Not measured',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  severe: 'Severe',
};

const LEVEL_ORDER: RiskLevel[] = ['unknown', 'low', 'moderate', 'high', 'severe'];

export function worstRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  if (a === 'unknown') return b;
  if (b === 'unknown') return a;
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

export interface MonitoringAssessment {
  level: RiskLevel;
  headline: string;
  summary: string;
  evidence: string[];
  recommendations: string[];
}

export interface CropStatusAssessment extends MonitoringAssessment {
  crop: string | null;
  growthStage: string | null;
  observationCount7d: number;
  observationCount30d: number;
}

export interface EnvironmentalRisk {
  id: 'heat' | 'drought' | 'excess-rain' | 'flood' | 'disease-weather' | 'official-warning';
  label: string;
  level: RiskLevel;
  detail: string;
  recommendation: string;
}

export interface EnvironmentalAssessment {
  level: RiskLevel;
  headline: string;
  risks: EnvironmentalRisk[];
}

export interface MonitoringMeasurement {
  label: string;
  value: string;
  measured: boolean;
  note: string;
}

export interface Advisory {
  id: string;
  title: string;
  action: string;
  detail: string;
  level: RiskLevel;
}

export interface MonitoringAnalytics {
  observations7d: number;
  observations30d: number;
  totalObservations: number;
  pestSignals30d: number;
  diseaseSignals30d: number;
  healthyObservations30d: number;
}

export interface CropMonitoringSnapshot {
  generatedAt: string;
  crop: string | null;
  cropStatus: CropStatusAssessment;
  pestRisk: MonitoringAssessment;
  waterStress: MonitoringAssessment;
  environment: EnvironmentalAssessment;
  advisories: Advisory[];
  measurements: MonitoringMeasurement[];
  calendar: { season: string; activities: string[] }[];
  commonPests: string[];
  commonDiseases: string[];
  recentObservations: CropAnalysisRecord[];
  upcomingTasks: FarmTask[];
  soil: SoilTestData | null;
  analytics: MonitoringAnalytics;
  sourceNote: string;
  unavailable: string[];
}

export interface CropMonitoringInput {
  weather: WeatherData | null;
  forecast: WeatherForecastDay[];
  warnings: WeatherWarning[];
  analyses: CropAnalysisRecord[];
  tasks: FarmTask[];
  soil: SoilTestData | null;
  sensorData?: LiveSensorData | null;
  farmerDetails: FarmerDetails | null;
  sourceNote?: string;
  unavailable?: string[];
}

const PEST_RE = /pest|insect|borer|aphid|worm|thrip|mite|whitefly|hopper|caterpillar|mealybug|weevil|semilooper|pyrilla|midge/i;
const DISEASE_RE = /disease|fung|blight|rot|rust|spot|mildew|wilt|smut|virus|mosaic|bacteri|anthracnose|scurf|ergot|blast/i;
const HEALTHY_RE = /no (major )?(disease|problem|issue)|healthy|normal/i;

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function maximum(values: Array<number | null | undefined>): number | null {
  const valid = values.filter(isNumber);
  return valid.length ? Math.max(...valid) : null;
}

function withinDays(iso: string, days: number, includeFuture = false): boolean {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return false;
  const delta = Date.now() - time;
  return includeFuture ? Math.abs(delta) <= days * 86_400_000 : delta >= 0 && delta <= days * 86_400_000;
}

function isUpcomingTask(task: FarmTask): boolean {
  if (task.status.toLowerCase() === 'completed') return false;
  const end = Date.parse(`${task.task_date}T${task.task_time || '23:59'}:00`);
  return Number.isFinite(end) ? end >= Date.now() - 86_400_000 : false;
}

function riskFromWarning(level: WeatherWarning['level']): RiskLevel {
  if (level === 'RED') return 'severe';
  if (level === 'ORANGE') return 'high';
  if (level === 'YELLOW') return 'moderate';
  return 'low';
}

function latestCrop(input: CropMonitoringInput): string | null {
  const analysisCrop = input.analyses[0]?.crop?.trim();
  const profileCrop = input.farmerDetails?.crop?.trim();
  return analysisCrop || profileCrop || null;
}

function buildObservations(input: CropMonitoringInput, days: number): CropAnalysisRecord[] {
  return input.analyses.filter((record) => withinDays(record.created_at, days));
}

function recordText(record: CropAnalysisRecord): string {
  return [record.problem, record.symptoms, record.causes, record.recommendations].filter(Boolean).join(' ');
}

function buildCalendar(crop: string | null): { season: string; activities: string[] }[] {
  return crop ? getCropCalendar(crop) ?? [] : [];
}

function assessCropStatus(input: CropMonitoringInput, crop: string | null): CropStatusAssessment {
  const observations7d = buildObservations(input, 7);
  const observations30d = buildObservations(input, 30);
  const latest = observations30d[0] ?? null;
  const calendar = buildCalendar(crop);
  const season = input.farmerDetails?.season;
  const growthStage = season
    ? calendar.find((entry) => entry.season.toLowerCase().includes(season))?.season ?? `Season: ${season}`
    : null;
  let level: RiskLevel = 'unknown';

  if (latest) {
    const text = recordText(latest);
    if (HEALTHY_RE.test(text) && !PEST_RE.test(text) && !DISEASE_RE.test(text)) level = 'low';
    else if (/severe|critical|severe damage|high confidence/i.test(text)) level = 'high';
    else level = 'moderate';
  }

  return {
    level,
    crop,
    growthStage,
    observationCount7d: observations7d.length,
    observationCount30d: observations30d.length,
    headline: latest ? (level === 'low' ? 'No major stress in latest observation' : 'Early stress needs field attention') : 'Crop status needs a field observation',
    summary: latest
      ? `Built from ${observations30d.length} saved Crop Health observation${observations30d.length === 1 ? '' : 's'}; this is not a continuous camera or sensor diagnosis.`
      : 'Complete Crop Health image analysis to add verified observations for monitoring.',
    evidence: [
      `${observations30d.length} recorded crop observation${observations30d.length === 1 ? '' : 's'} in the last 30 days`,
      latest ? `Latest observation: ${latest.problem}` : 'No recent Crop Health observation is available',
      growthStage ? `Profile/calendar reference: ${growthStage}` : 'Actual growth stage is not verified because planting date is unavailable',
    ],
    recommendations: latest
      ? ['Inspect the reported symptoms in the field', 'Record new images through Crop Health if signs change']
      : ['Open Crop Health to analyze a current leaf or crop image', 'Scout representative plants across the field'],
  };
}

function assessPestRisk(input: CropMonitoringInput, observations30d: CropAnalysisRecord[]): MonitoringAssessment {
  const pestRecords = observations30d.filter((record) => PEST_RE.test(recordText(record)));
  const temperature = input.weather?.temperature ?? null;
  const humidity = input.weather?.humidity ?? null;
  const weatherLevel: RiskLevel = temperature !== null && temperature >= 28 && humidity !== null && humidity >= 65
    ? 'moderate'
    : temperature !== null || humidity !== null
      ? 'low'
      : 'unknown';
  const level = worstRisk(pestRecords.length ? 'moderate' : 'low', weatherLevel);
  return {
    level,
    headline: pestRecords.length ? 'Pest activity recorded — scout now' : 'No pest activity recorded in saved observations',
    summary: pestRecords.length
      ? `${pestRecords.length} saved observation${pestRecords.length === 1 ? '' : 's'} mention${pestRecords.length === 1 ? 's' : ''} a pest-related signal.`
      : 'Absence of a saved signal does not prove pests are absent; inspect a sample of plants.',
    evidence: [
      pestRecords.length ? `Pest-related observations: ${pestRecords.slice(0, 3).map((record) => record.problem).join('; ')}` : 'No pest mention in saved Crop Health records',
      temperature !== null ? `Current weather temperature: ${Math.round(temperature)}°C` : 'Temperature unavailable',
      humidity !== null ? `Current weather humidity: ${Math.round(humidity)}%` : 'Humidity unavailable',
    ],
    recommendations: [
      'Scout a sample of plants and inspect leaf undersides',
      'Use traps or field scouting before targeted treatment',
      'Confirm the crop and pest before choosing any intervention',
    ],
  };
}

function assessWaterStress(input: CropMonitoringInput): MonitoringAssessment {
  const currentRain = input.weather?.rainfall ?? null;
  const forecastRain = maximum(input.forecast.slice(0, 3).map((day) => day.rainProbability));
  const temperature = input.weather?.temperature ?? null;
  const irrigationTask = input.tasks.find((task) => task.task_type === 'irrigation' && isUpcomingTask(task));
  const hotDry = temperature !== null && temperature >= 35 && (forecastRain === null || forecastRain < 25);
  const wet = (currentRain !== null && currentRain >= 20) || (forecastRain !== null && forecastRain >= 70);
  const dry = temperature !== null && temperature >= 35 && forecastRain !== null && forecastRain < 20;
  let level: RiskLevel = 'unknown';
  if (wet) level = 'moderate';
  else if (hotDry) level = 'moderate';
  else if (temperature !== null || forecastRain !== null) level = 'low';

  let action = 'Check soil moisture by hand before irrigating';
  if (wet) action = 'Delay irrigation and check drainage';
  else if (dry) action = 'Consider irrigating soon after checking soil moisture';
  else if (irrigationTask) action = `Follow planned task: ${irrigationTask.title}`;

  return {
    level,
    headline: wet ? 'Rain signal: delay additional irrigation' : hotDry ? 'Water stress is possible in hot, dry weather' : 'Soil-water status needs a field check',
    summary: 'This recommendation uses real weather, forecast, and saved tasks. Soil moisture is not sensor-measured in this web app.',
    evidence: [
      currentRain !== null ? `Current rainfall: ${currentRain} mm` : 'Current rainfall unavailable',
      forecastRain !== null ? `Maximum rain probability in next 3 days: ${Math.round(forecastRain)}%` : 'Forecast rain probability unavailable',
      temperature !== null ? `Current temperature: ${Math.round(temperature)}°C` : 'Temperature unavailable',
      irrigationTask ? `Planned irrigation task: ${irrigationTask.title}` : 'No upcoming irrigation task found',
    ],
    recommendations: [action, 'Use a field soil-moisture check before deciding water quantity', 'Keep drainage channels clear during heavy rain'],
  };
}

function assessEnvironment(input: CropMonitoringInput): EnvironmentalAssessment {
  const temp = input.weather?.temperature ?? null;
  const humidity = input.weather?.humidity ?? null;
  const rain = input.weather?.rainfall ?? null;
  const forecastRain = maximum(input.forecast.slice(0, 3).map((day) => day.rainProbability));
  const peakTemp = maximum(input.forecast.slice(0, 7).map((day) => day.tempMax));
  const risks: EnvironmentalRisk[] = [];
  const heat = (temp !== null && temp >= 38) || (peakTemp !== null && peakTemp >= 40);
  if (heat) risks.push({ id: 'heat', label: 'Heat stress', level: (temp !== null && temp >= 40 || peakTemp !== null && peakTemp >= 42) ? 'severe' : 'high', detail: 'High temperature is recorded in the available weather data.', recommendation: 'Prioritize a water check, mulching, and shade-sensitive crop care.' });
  const dry = forecastRain !== null && forecastRain < 20 && ((temp !== null && temp >= 32) || (peakTemp !== null && peakTemp >= 35));
  if (dry) risks.push({ id: 'drought', label: 'Drought risk', level: 'moderate', detail: 'Low rain probability and elevated temperature are in the forecast.', recommendation: 'Check soil moisture and protect sensitive growth stages.' });
  const excessRain = (rain !== null && rain >= 15) || (forecastRain !== null && forecastRain >= 60);
  if (excessRain) risks.push({ id: rain !== null && rain >= 50 ? 'flood' : 'excess-rain', label: rain !== null && rain >= 50 ? 'Flood / excess-rain risk' : 'Excess-rain risk', level: (rain !== null && rain >= 50 || forecastRain !== null && forecastRain >= 80) ? 'high' : 'moderate', detail: 'Rainfall or rain probability indicates a wet-weather risk.', recommendation: 'Clear drainage channels and protect low-lying crop areas.' });
  if (humidity !== null && humidity >= 80) risks.push({ id: 'disease-weather', label: 'Disease-favourable humidity', level: 'moderate', detail: `Current humidity is ${Math.round(humidity)}%, which can favour some diseases.`, recommendation: 'Scout for spots, blight, mildew, and other stress signs.' });
  for (const warning of input.warnings.slice(0, 4)) risks.push({ id: 'official-warning', label: warning.title, level: riskFromWarning(warning.level), detail: `${warning.area} · valid until ${warning.validUntil}`, recommendation: warning.actions[0] ?? 'Follow the official advisory.' });
  const level = risks.reduce<RiskLevel>((current, risk) => worstRisk(current, risk.level), 'unknown');
  return { level, headline: level === 'unknown' ? 'Environmental risk is unavailable' : level === 'low' ? 'No major environmental signal right now' : `Environmental attention: ${RISK_LABEL[level].toLowerCase()} risk`, risks };
}

function buildAdvisories(crop: CropStatusAssessment, pest: MonitoringAssessment, water: MonitoringAssessment, environment: EnvironmentalAssessment): Advisory[] {
  const advisories: Advisory[] = [];
  if (environment.risks.some((risk) => risk.id === 'heat')) advisories.push({ id: 'heat', title: 'Heat-stress warning', action: 'Prioritize field checks', detail: 'High temperature is available. Check sensitive plants and soil moisture before applying water.', level: environment.level });
  if (environment.risks.some((risk) => risk.id === 'flood' || risk.id === 'excess-rain')) advisories.push({ id: 'rain', title: 'Flood / excess-rain alert', action: 'Check drainage', detail: 'Rain signal detected. Clear low-lying channels and avoid unnecessary irrigation.', level: environment.level });
  if (water.level === 'moderate' && water.headline.includes('Rain')) advisories.push({ id: 'delay-irrigation', title: 'Delay irrigation', action: 'Wait and re-check', detail: 'Rain signal detected. Verify rainfall and soil moisture before irrigating.', level: 'moderate' });
  else if (water.level === 'moderate') advisories.push({ id: 'irrigate', title: 'Irrigation decision support', action: 'Check soil, then irrigate if dry', detail: 'Weather suggests possible water stress; this app has no soil-moisture sensor reading.', level: 'moderate' });
  if (pest.level !== 'low') advisories.push({ id: 'pest', title: 'Pest activity alert', action: 'Scout the crop', detail: 'A pest-related signal or pest-favourable weather was found. Inspect a sample before intervention.', level: pest.level });
  if (crop.level !== 'unknown' && crop.level !== 'low') advisories.push({ id: 'disease', title: 'Possible disease or stress detected', action: 'Review Crop Health', detail: 'A saved Crop Health observation contains a disease/stress signal. Review the original analysis and inspect the field.', level: crop.level });
  if (!advisories.length) advisories.push({ id: 'baseline', title: 'Keep monitoring your field', action: 'Scout and record observations', detail: 'No major alert is active in the available data. Add Crop Health observations to improve field-level insight.', level: 'low' });
  return advisories.slice(0, 5);
}

function buildMeasurements(input: CropMonitoringInput): MonitoringMeasurement[] {
  const sensorData = input.sensorData;
  const reading = sensorData?.reading ?? null;
  const device = sensorData?.device ?? null;
  const sensorValue = (value: number | null | undefined, unit: string) => value === null || value === undefined ? 'Not measured' : `${value}${unit}`;
  const sensorMeasured = (value: number | null | undefined) => value !== null && value !== undefined;
  const deviceStatus = device?.status?.trim().toLowerCase();
  const deviceStatusLabel = deviceStatus === 'online' || deviceStatus === 'connected' || deviceStatus === 'active'
    ? 'Online'
    : deviceStatus === 'offline'
      ? 'Offline'
      : device
        ? 'Status unavailable'
        : 'No live sensor data';

  return [
    { label: 'Soil moisture', value: 'Not measured', measured: false, note: 'No physical moisture sensor is connected.' },
    { label: 'Temperature', value: input.weather?.temperature !== null && input.weather?.temperature !== undefined ? `${Math.round(input.weather.temperature)}°C` : 'Unavailable', measured: !!input.weather && isNumber(input.weather.temperature), note: 'Weather source, not a crop-canopy sensor.' },
    { label: 'Humidity', value: input.weather?.humidity !== null && input.weather?.humidity !== undefined ? `${Math.round(input.weather.humidity)}%` : 'Unavailable', measured: !!input.weather && isNumber(input.weather.humidity), note: 'Weather source, not a leaf-wetness sensor.' },
    { label: 'Sensor device', value: deviceStatusLabel, measured: !!device, note: device ? `Existing device record${device.last_seen_at ? `; last seen ${new Date(device.last_seen_at).toLocaleString('en-IN')}` : ''}.` : 'No connected device record is available.' },
    { label: 'Sensor soil moisture', value: sensorValue(reading?.soil_moisture, '%'), measured: sensorMeasured(reading?.soil_moisture), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor temperature', value: sensorValue(reading?.temperature, '°C'), measured: sensorMeasured(reading?.temperature), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor humidity', value: sensorValue(reading?.humidity, '%'), measured: sensorMeasured(reading?.humidity), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor rainfall', value: sensorValue(reading?.rainfall_mm, ' mm'), measured: sensorMeasured(reading?.rainfall_mm), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor water level', value: sensorValue(reading?.water_level, ''), measured: sensorMeasured(reading?.water_level), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor battery voltage', value: sensorValue(reading?.battery_voltage, ' V'), measured: sensorMeasured(reading?.battery_voltage), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor signal strength', value: sensorValue(reading?.signal_strength, ' dBm'), measured: sensorMeasured(reading?.signal_strength), note: reading ? 'Real sensor_readings value.' : 'No live sensor data.' },
    { label: 'Sensor reading time', value: reading?.recorded_at ? new Date(reading.recorded_at).toLocaleString('en-IN') : 'No live sensor data', measured: !!reading, note: reading ? `Latest live reading from ${reading.data_source ?? 'sensor'}.` : 'No live sensor data.' },
    { label: 'Edge camera / AI', value: 'Future integration', measured: false, note: 'The current web app has no connected field camera or on-device model.' },
  ];
}

export function buildCropMonitoringSnapshot(input: CropMonitoringInput): CropMonitoringSnapshot {
  const crop = latestCrop(input);
  const observations30d = buildObservations(input, 30);
  const cropStatus = assessCropStatus(input, crop);
  const pestRisk = assessPestRisk(input, observations30d);
  const waterStress = assessWaterStress(input);
  const environment = assessEnvironment(input);
  const pestCount = observations30d.filter((record) => PEST_RE.test(recordText(record))).length;
  const diseaseCount = observations30d.filter((record) => DISEASE_RE.test(recordText(record))).length;
  const healthyCount = observations30d.filter((record) => HEALTHY_RE.test(recordText(record))).length;
  const upcomingTasks = input.tasks.filter(isUpcomingTask).sort((a, b) => a.task_date.localeCompare(b.task_date));
  return {
    generatedAt: new Date().toISOString(),
    crop,
    cropStatus,
    pestRisk,
    waterStress,
    environment,
    advisories: buildAdvisories(cropStatus, pestRisk, waterStress, environment),
    measurements: buildMeasurements(input),
    calendar: buildCalendar(crop),
    commonPests: getCropInfo(crop || '')?.commonPests ?? [],
    commonDiseases: getCropInfo(crop || '')?.commonDiseases ?? [],
    recentObservations: input.analyses.slice(0, 5),
    upcomingTasks: upcomingTasks.slice(0, 5),
    soil: input.soil,
    analytics: { observations7d: buildObservations(input, 7).length, observations30d: observations30d.length, totalObservations: input.analyses.length, pestSignals30d: pestCount, diseaseSignals30d: diseaseCount, healthyObservations30d: healthyCount },
    sourceNote: input.sourceNote ?? 'Weather, saved Crop Health observations, farm tasks, farmer profile, and soil test data.',
    unavailable: input.unavailable ?? [],
  };
}

export interface LoadCropMonitoringOptions {
  latitude: number | null;
  longitude: number | null;
  farmerDetails: FarmerDetails | null;
}

export async function loadCropMonitoringSnapshot(options: LoadCropMonitoringOptions): Promise<CropMonitoringSnapshot> {
  const [weatherResult, analysesResult, tasksResult, sensorResult] = await Promise.allSettled([
    options.latitude !== null && options.longitude !== null ? fetchWeather(options.latitude, options.longitude) : Promise.resolve(null),
    fetchCropAnalyses(),
    fetchFarmTasks(),
    readLatestLiveSensorData(),
  ]);
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const analyses = analysesResult.status === 'fulfilled' ? analysesResult.value : [];
  const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
  const sensorData = sensorResult.status === 'fulfilled' ? sensorResult.value : null;
  const unavailable: string[] = [];
  if (options.latitude === null || options.longitude === null) unavailable.push('Location and live weather are unavailable.');
  else if (weatherResult.status === 'rejected' || !weather?.current) unavailable.push('Live weather is unavailable; environmental risk is not fabricated.');
  if (analysesResult.status === 'rejected') unavailable.push('Saved Crop Health observations could not be loaded.');
  if (tasksResult.status === 'rejected') unavailable.push('Farm tasks could not be loaded.');
  if (sensorResult.status === 'rejected') unavailable.push('Live sensor readings could not be loaded.');
  else if (!sensorData?.reading) unavailable.push('No live sensor data is available for the connected device.');
  return buildCropMonitoringSnapshot({
    weather: weather?.current ?? null,
    forecast: weather?.forecast ?? [],
    warnings: weather?.warnings ?? [],
    analyses,
    tasks,
    soil: loadSoilTest(),
    sensorData,
    farmerDetails: options.farmerDetails,
    sourceNote: weather?.source ? `${weather.source.sourceName}; ${weather.source.lastUpdated}.` : 'No live weather source is currently available.',
    unavailable,
  });
}

