import type { CropHealthResult, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface CropHealthAnalysis {
  result: CropHealthResult | null;
  source: SourceMetadata;
  available: boolean;
  error: string | null;
  /** True when the result came from the server-side AI (DeepSeek) path. */
  ai?: boolean;
}

// This is a rule-based analysis system that looks at symptoms described
// by the farmer and cross-references with known agricultural patterns.
// It is NOT a medical diagnostic system and should never claim 100% certainty.
export function analyzeCropHealth(
  crop: string,
  symptoms: string,
  growthStage: string,
  recentRainfall: string,
  irrigation: string,
  visibleInsects: string,
  recentFertilizer: string,
): CropHealthAnalysis {
  const now = new Date();
  // Normalize all farmer-provided fields (select values arrive capitalized,
  // e.g. "Heavy", "Yes", "None") so the rule engine actually uses them.
  const norm = (value: string) => (value || '').toLowerCase().trim();
  const symptomsLower = norm(symptoms);
  const rainfall = norm(recentRainfall);
  const irrig = norm(irrigation);
  const insects = norm(visibleInsects);
  const fert = norm(recentFertilizer);
  const stage = norm(growthStage);

  // Only attempt analysis if we have enough information
  if (!symptoms || symptoms.trim().length < 3) {
    return {
      result: null,
      source: {
        sourceName: OFFICIAL_SOURCES.ICAR.name,
        sourceUrl: OFFICIAL_SOURCES.ICAR.url,
        sourceType: 'AI',
        isLive: false,
        isVerified: false,
        lastUpdated: formatLastUpdated(now),
        status: 'unavailable',
      },
      available: false,
      error: 'Please provide more details about the symptoms you are seeing on your crop.',
    };
  }

  const possibleCauses: string[] = [];
  const visibleSymptoms: string[] = [];
  const whatToDoNow: string[] = [];
  const prevention: string[] = [];
  const monitor: string[] = [];

  let possibleProblem = '';
  let confidence: CropHealthResult['confidence'] = 'Low';
  let severity = 'Unknown';

  // Nutrient deficiency indicators
  if (symptomsLower.includes('yellow') && symptomsLower.includes('leaf')) {
    if (symptomsLower.includes('young') || symptomsLower.includes('top')) {
      possibleProblem = 'Possible Sulphur or Iron deficiency';
      possibleCauses.push('Sulphur deficiency (affects younger leaves first)', 'Iron deficiency (common in alkaline soils)');
    } else {
      possibleProblem = 'Possible Nitrogen deficiency';
      possibleCauses.push('Nitrogen deficiency (affects older leaves first)');
    }
    visibleSymptoms.push('Yellowing of leaves');
    whatToDoNow.push('Consider soil testing to confirm nutrient status', 'Apply appropriate fertilizer only after confirming deficiency');
    prevention.push('Regular soil testing every 2-3 years', 'Balanced fertilizer application based on soil test results');
    monitor.push('Leaf color changes over the next 7-10 days', 'New growth after fertilizer application');
    confidence = 'Medium';
    severity = 'Moderate';
  }

  // Fungal disease indicators
  if (symptomsLower.includes('spot') || symptomsLower.includes('lesion') || symptomsLower.includes('mold') || symptomsLower.includes('fungus')) {
    possibleProblem = possibleProblem || 'Possible Fungal Infection';
    possibleCauses.push('Fungal pathogen infection', 'High humidity or excess moisture conditions');
    visibleSymptoms.push('Spots or lesions on leaves/stems', 'Possible fungal growth');
    whatToDoNow.push('Remove and destroy affected plant parts', 'Improve air circulation by proper spacing', 'Avoid overhead irrigation if possible');
    prevention.push('Use disease-resistant varieties', 'Practice crop rotation', 'Maintain proper plant spacing');
    monitor.push('Spread of spots to nearby plants', 'New lesions appearing on healthy tissue');
    confidence = 'Medium';
    severity = 'Moderate';
  }

  // Pest/insect indicators
  if (insects === 'yes' || symptomsLower.includes('insect') || symptomsLower.includes('pest') || symptomsLower.includes('borer') || symptomsLower.includes('aphid')) {
    possibleProblem = possibleProblem || 'Possible Pest/Insect Infestation';
    possibleCauses.push('Insect pest infestation', 'Caterpillar/borer/aphid activity');
    visibleSymptoms.push('Visible insects on the plant', 'Chewed or damaged leaves/stems', 'Holes in leaves or stems');
    whatToDoNow.push('Identify the specific insect if possible', 'Use mechanical control (hand picking, light traps) for small infestations', 'Consider biological control methods (e.g., neem oil)');
    prevention.push('Regular field scouting', 'Use pheromone traps for monitoring', 'Intercropping with pest-repellent plants');
    monitor.push('Insect population levels', 'New damage on previously unaffected plants');
    confidence = 'Medium';
    severity = 'Moderate';
  }

  // Water stress indicators
  if (symptomsLower.includes('dry') || symptomsLower.includes('wilt') || symptomsLower.includes('curl') || symptomsLower.includes('droop')) {
    if (rainfall === 'none' || rainfall === 'low' || irrig === 'none' || irrig === 'low') {
      possibleProblem = possibleProblem || 'Possible Water Stress';
      possibleCauses.push('Insufficient water supply', 'Drought conditions', 'Inadequate irrigation');
      visibleSymptoms.push('Wilting or drooping leaves', 'Leaf curling', 'Dry appearance');
      whatToDoNow.push('Apply irrigation if water is available', 'Use mulching to conserve soil moisture', 'Check soil moisture levels');
      prevention.push('Drought-resistant varieties for dry areas', 'Efficient irrigation systems (drip/sprinkler)', 'Rainwater harvesting');
      monitor.push('Soil moisture levels', 'Recovery after irrigation');
      confidence = 'High';
      severity = 'Moderate to Severe';
    }
  }

  // Heat stress indicators
  if (symptomsLower.includes('scorch') || symptomsLower.includes('burn') || symptomsLower.includes('heat') || symptomsLower.includes('brown') && symptomsLower.includes('edge')) {
    possibleProblem = possibleProblem || 'Possible Heat Stress';
    possibleCauses.push('High temperature stress', 'Excessive sun exposure', 'Hot, dry winds');
    visibleSymptoms.push('Leaf scorching or browning at edges', 'Wilting during hottest hours');
    whatToDoNow.push('Provide shade if possible for young plants', 'Apply irrigation to cool the plants', 'Use mulch to keep soil cool');
    prevention.push('Plant heat-tolerant varieties', 'Adjust planting dates to avoid peak heat', 'Use shade nets for sensitive crops');
    monitor.push('Temperature extremes', 'Recovery during cooler periods');
    confidence = 'Medium';
    severity = 'Moderate';
  }

  // Excess moisture indicators
  if (symptomsLower.includes('rot') || symptomsLower.includes('waterlog') || symptomsLower.includes('flood') || (rainfall === 'heavy' && symptomsLower.includes('yellow'))) {
    possibleProblem = possibleProblem || 'Possible Excess Moisture / Waterlogging';
    possibleCauses.push('Excess water from heavy rainfall', 'Poor drainage', 'Waterlogging stress');
    visibleSymptoms.push('Yellowing and wilting', 'Root rot symptoms', 'Stunted growth');
    whatToDoNow.push('Improve drainage in the field', 'Avoid further irrigation', 'Allow soil to dry out');
    prevention.push('Proper field drainage systems', 'Raised bed planting in high-rainfall areas', 'Avoid planting in low-lying areas');
    monitor.push('Soil moisture levels', 'Root health after drainage improvement');
    confidence = 'Medium';
    severity = 'Moderate';
  }

// Growth-stage aware refinements (only add context — never override a stronger match)
  if (stage) {
    if (stage === 'seedling' && (symptomsLower.includes('wilt') || symptomsLower.includes('rot') || symptomsLower.includes('damp'))) {
      possibleProblem = possibleProblem || 'Possible Damping-off / Seedling Rot';
      possibleCauses.push('Fungal damping-off in young seedlings', 'Excess moisture around seedlings', 'Poor air circulation');
      visibleSymptoms.push('Wilting or rotting at the base of young seedlings');
      whatToDoNow.push('Reduce watering and improve drainage', 'Improve air circulation around seedlings');
      prevention.push('Use treated/disease-free seed', 'Use a well-drained seedbed or nursery trays');
      monitor.push('Spread to nearby seedlings', 'Discoloration at the stem base');
      confidence = confidence === 'Low' ? 'Medium' : confidence;
      severity = severity === 'Unknown' ? 'Moderate' : severity;
    }
    if ((stage === 'flowering' || stage === 'fruiting') && symptomsLower.includes('drop')) {
      possibleProblem = possibleProblem || 'Possible Flower/Fruit Drop';
      possibleCauses.push('Heat or water stress during flowering/fruiting', 'Nutrient imbalance');
      visibleSymptoms.push('Flower or young fruit drop');
      whatToDoNow.push('Maintain consistent irrigation', 'Avoid water stress during flowering');
      prevention.push('Mulching to retain soil moisture', 'Balanced nutrition around flowering');
      monitor.push('Fruit set over the next week', 'New flower drop');
      confidence = confidence === 'Low' ? 'Medium' : confidence;
      severity = severity === 'Unknown' ? 'Moderate' : severity;
    }
  }

  // Fertilizer context (conservative guidance only — never overrides the symptom match)
  if (fert && fert !== 'none' && fert !== 'no') {
    if (fert.includes('urea') || fert.includes('nitrogen')) {
      possibleCauses.push('Recent nitrogen (urea) application — check for over-application effects');
      prevention.push('Apply nitrogen in split doses based on crop stage');
    } else if (fert.includes('dap') || fert.includes('phosphorus') || fert.includes('phosphate')) {
      possibleCauses.push('Recent phosphorus (DAP) application — monitor for burn on young plants');
      prevention.push('Place fertilizer in bands away from the root zone');
    } else if (fert.includes('potash') || fert.includes('potassium')) {
      possibleCauses.push('Recent potash application — potassium imbalance can affect leaf edges');
      prevention.push('Match potash application to soil test results');
    } else {
      possibleCauses.push(`Recent fertilizer/input applied (${recentFertilizer}) — rule out fertilizer burn near the applied area`);
      prevention.push('Apply fertilizer in well-spaced bands and water it in');
    }
  }

  // Severity indication from the farmer's own description
  const severeTerms = ['severe', 'whole field', 'all plants', 'entire crop', 'spreading fast', 'worse', 'dying'];
  const soundsSevere = severeTerms.some((w) => symptomsLower.includes(w));
  if (soundsSevere) {
    severity = severity === 'Unknown' ? 'Severe' : severity.includes('Severe') ? severity : `${severity} to Severe`;
    confidence = confidence === 'High' ? 'Medium' : confidence;
  }
  // Default: unknown issue
  if (!possibleProblem) {
    possibleProblem = 'Unable to determine the specific issue from the information provided';
    possibleCauses.push('The symptoms described could be due to multiple factors. More information is needed.');
    visibleSymptoms.push('Symptoms as described by the farmer');
    whatToDoNow.push('Please consult your nearest KVK or agriculture officer for an expert field diagnosis', 'Take clear photos of the affected plants for expert review');
    prevention.push('Regular field monitoring', 'Maintain proper crop management practices');
    monitor.push('Any changes in symptoms over the next few days', 'Spread to other plants in the field');
    confidence = 'Low';
    severity = 'Unknown';
  }

  // Add expert consultation note for low confidence
  if (confidence === 'Low') {
    whatToDoNow.push('Please verify with a KVK/agriculture officer before taking major treatment decisions');
  }

  // Pesticide safety note
  whatToDoNow.push('Please consult your KVK/agriculture officer before applying any chemical treatment');

  const result: CropHealthResult = {
    crop: crop || 'Unknown crop',
    possibleProblem,
    confidence,
    severity,
    visibleSymptoms,
    possibleCauses,
    whatToDoNow,
    prevention,
    monitor,
    sources: [OFFICIAL_SOURCES.ICAR.name, 'ICAR-NCIPM', OFFICIAL_SOURCES.KISAN_SARATHI.name],
  };

  return {
    result,
    source: {
      sourceName: 'AI Crop Analysis (Rule-based)',
      sourceUrl: OFFICIAL_SOURCES.ICAR.url,
      sourceType: 'AI',
      isLive: false,
      isVerified: false,
      lastUpdated: formatLastUpdated(now),
      status: 'available',
    },
    available: true,
    error: null,
  };
}
// ---------------------------------------------------------------------------
// Optional AI-first analysis
//
// analyzeCropHealthWithAI tries the Supabase Edge Function "crop-health-ai"
// (which keeps any DeepSeek API key server-side). If the Edge Function is not
// deployed, not configured, or the network/AI provider fails, the existing
// local rule-based analyzeCropHealth is used as the fallback. The page can
// therefore never become unusable because of the AI endpoint.
// ---------------------------------------------------------------------------

const AI_REQUEST_TIMEOUT_MS = 12_000;

function localAnalysis(
  crop: string,
  symptoms: string,
  growthStage: string,
  recentRainfall: string,
  irrigation: string,
  visibleInsects: string,
  recentFertilizer: string,
): CropHealthAnalysis {
  return analyzeCropHealth(crop, symptoms, growthStage, recentRainfall, irrigation, visibleInsects, recentFertilizer);
}

function clampConfidence(value: unknown): CropHealthResult['confidence'] {
  const v = typeof value === 'string' ? value.toLowerCase() : '';
  if (v === 'high' || v === 'medium') return v as CropHealthResult['confidence'];
  return 'Low';
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item : '').trim())
    .filter((item) => item.length > 0);
}

function isAiResult(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.problem === 'string' &&
    record.problem.trim().length > 0 &&
    Array.isArray(record.actions) &&
    record.actions.length > 0;
}

function mapAiResult(payload: unknown, crop: string): CropHealthResult {
  const raw = typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : ({} as Record<string, unknown>);
  const readStr = (key: string, fallback: string): string => {
    const v = raw[key];
    return typeof v === 'string' && v.trim() ? v.trim() : fallback;
  };

  const confidence = clampConfidence(raw.confidence);
  const severity = readStr('severity', 'Unknown');
  const possibleProblem = readStr('problem', 'Unable to determine the specific issue from the information provided');
  const whatToDoNow = readStringArray(raw.actions);
  if (confidence === 'Low' || /severe/i.test(severity)) {
    whatToDoNow.push('Please verify with a KVK/agriculture officer before taking major treatment decisions');
  }
  const expertNote = readStr('expertNote', '');
  if (expertNote) whatToDoNow.push(expertNote);
  whatToDoNow.push('Please consult your KVK/agriculture officer before applying any chemical treatment');

  return {
    crop: crop || 'Unknown crop',
    possibleProblem,
    confidence,
    severity,
    visibleSymptoms: readStringArray(raw.symptoms),
    possibleCauses: readStringArray(raw.causes),
    whatToDoNow,
    prevention: readStringArray(raw.prevention),
    monitor: readStringArray(raw.monitoring),
    sources: [OFFICIAL_SOURCES.ICAR.name, 'DeepSeek AI (server-side, Supabase Edge Function)', OFFICIAL_SOURCES.KISAN_SARATHI.name],
  };
}

export async function analyzeCropHealthWithAI(
  crop: string,
  symptoms: string,
  growthStage: string,
  recentRainfall: string,
  irrigation: string,
  visibleInsects: string,
  recentFertilizer: string,
  language = 'en',
): Promise<CropHealthAnalysis> {
  const now = new Date();

  // Same low-information guard as the local engine — do not waste an AI call.
  if (!symptoms || symptoms.trim().length < 3) {
    return localAnalysis(crop, symptoms, growthStage, recentRainfall, irrigation, visibleInsects, recentFertilizer);
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl) {
      return localAnalysis(crop, symptoms, growthStage, recentRainfall, irrigation, visibleInsects, recentFertilizer);
    }

    const baseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${baseUrl}/functions/v1/crop-health-ai`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(anonKey ? { apikey: anonKey } : {}),
        },
        body: JSON.stringify({
          crop,
          growthStage,
          symptoms,
          rainfall: recentRainfall,
          irrigation,
          insects: visibleInsects,
          fertilizer: recentFertilizer,
          language,
        }),
      });
      if (!res.ok) throw new Error(`The AI health endpoint responded with ${res.status}.`);
      const data: unknown = await res.json();
      const record = typeof data === 'object' && data !== null && !Array.isArray(data)
        ? data as Record<string, unknown>
        : null;
      if (!record || record.ok !== true || !isAiResult(record.result)) {
        throw new Error('The AI health endpoint returned no usable result.');
      }

      return {
        result: mapAiResult(record.result, crop),
        source: {
          sourceName: 'AI Crop Analysis (DeepSeek via Supabase)',
          sourceUrl: OFFICIAL_SOURCES.ICAR.url,
          sourceType: 'AI',
          isLive: false,
          isVerified: false,
          lastUpdated: formatLastUpdated(now),
          status: 'available',
        },
        available: true,
        error: null,
        ai: true,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Any failure (not deployed, missing key, timeout, network) → local fallback.
    return localAnalysis(crop, symptoms, growthStage, recentRainfall, irrigation, visibleInsects, recentFertilizer);
  }
}
