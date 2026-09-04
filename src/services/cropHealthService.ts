import type { CropHealthResult, SourceMetadata } from '@/types';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';

export interface CropHealthAnalysis {
  result: CropHealthResult | null;
  source: SourceMetadata;
  available: boolean;
  error: string | null;
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
  const symptomsLower = symptoms.toLowerCase();

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
  if (visibleInsects === 'yes' || symptomsLower.includes('insect') || symptomsLower.includes('pest') || symptomsLower.includes('borer') || symptomsLower.includes('aphid')) {
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
    if (recentRainfall === 'none' || recentRainfall === 'low' || irrigation === 'none' || irrigation === 'low') {
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
  if (symptomsLower.includes('rot') || symptomsLower.includes('waterlog') || symptomsLower.includes('flood') || (recentRainfall === 'heavy' && symptomsLower.includes('yellow'))) {
    possibleProblem = possibleProblem || 'Possible Excess Moisture / Waterlogging';
    possibleCauses.push('Excess water from heavy rainfall', 'Poor drainage', 'Waterlogging stress');
    visibleSymptoms.push('Yellowing and wilting', 'Root rot symptoms', 'Stunted growth');
    whatToDoNow.push('Improve drainage in the field', 'Avoid further irrigation', 'Allow soil to dry out');
    prevention.push('Proper field drainage systems', 'Raised bed planting in high-rainfall areas', 'Avoid planting in low-lying areas');
    monitor.push('Soil moisture levels', 'Root health after drainage improvement');
    confidence = 'Medium';
    severity = 'Moderate';
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
