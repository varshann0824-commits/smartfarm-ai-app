import type { AIResponse, LocationInfo } from '@/types';
import { detectIntent, type Intent, type IntentResult } from './intentDetector';
import { extractEntities, type ExtractedEntities } from './entityExtractor';
import { validateFreshness, type FreshnessResult } from './freshnessValidator';
import { getResponseTemplate, formatEntities, type LanguageCode } from './multilingualResponses';
import { detectLanguage } from './languageDetector';
import { OFFICIAL_SOURCES, formatLastUpdated } from './sourceMetadata';
import { fetchMarketPrices } from './marketService';
import { fetchWeather } from './weatherService';
import { getKnownSchemes } from './schemeService';
import { getSellCropRoutes } from './sellCropService';
import { analyzeCropHealth } from './cropHealthService';
import { getCropRecommendations } from './cropRecommendationService';
import { getAgricultureKnowledge } from './agricultureKnowledgeService';

export interface RADEContext {
  location: LocationInfo | null;
  language: string;
  demoMode: boolean;
}

export interface RADEResult {
  response: AIResponse;
  intent: Intent;
  intentResult: IntentResult;
  entities: ExtractedEntities;
  freshness: FreshnessResult | null;
  detectedLanguage: string;
  processingSteps: string[];
}

type ResponseTpl = ReturnType<typeof getResponseTemplate>;

async function routeMarketPrice(
  _q: string, entities: ExtractedEntities, _ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  const result = await fetchMarketPrices();
  if (result.source.status === 'unavailable') {
    return {
      text: tpl.status.unavailable + ' — ' + (lang === 'te' ? 'మార్కెట్ ధరలు ప్రస్తుతం అందుబాటులో లేవు.' : lang === 'hi' ? 'बाजार भाव अभी उपलब्ध नहीं हैं।' : 'Live market data is temporarily unavailable.'),
      confidence: null, dataStatus: 'unavailable', sources: [result.source],
      actions: [{ label: tpl.actions.retry, action: 'retry' }, { label: tpl.actions.openSource, link: OFFICIAL_SOURCES.AGMARKNET.url }],
    };
  }
  const cropFilter = entities.crop;
  const filtered = cropFilter ? result.prices.filter(p => p.commodity.toLowerCase().includes(cropFilter.toLowerCase())) : result.prices;
  const prices = filtered.length > 0 ? filtered : result.prices.slice(0, 3);
  const cropLabel = cropFilter || (lang === 'te' ? 'మీ పంట' : lang === 'hi' ? 'आपकी फसल' : 'your crop');
  const priceLines = prices.slice(0, 5).map(p => `${p.commodity} — ${p.market}: Min Rs.${p.minPrice ?? '—'}, Max Rs.${p.maxPrice ?? '—'}, Modal Rs.${p.modalPrice ?? '—'}/quintal (${p.date})`).join('\n');
  const header = lang === 'te' ? `ధరలు (${cropLabel}):` : lang === 'hi' ? `भाव (${cropLabel}):` : `Prices for ${cropLabel}:`;
  return {
    text: `${header}\n\n${priceLines}\n\nSource: ${result.source.sourceName}`,
    confidence: 'High', dataStatus: 'live', sources: [result.source],
    actions: [{ label: tpl.actions.viewDetails, link: '/market' }],
  };
}

async function routeWeather(
  _q: string, _e: ExtractedEntities, ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  if (!ctx.location?.latitude || !ctx.location?.longitude) {
    return {
      text: lang === 'te' ? 'వాతావరణం కోసం మీ స్థానం అవసరం. సెట్టింగ్‌లలో స్థానాన్ని అనుమతించండి.' : lang === 'hi' ? 'मौसम के लिए स्थान चाहिए। सेटिंग्स में अनुमति दें।' : 'I need your location for weather. Please allow location access in Settings.',
      confidence: null, dataStatus: 'unavailable', sources: [],
      actions: [{ label: tpl.actions.viewDetails, link: '/settings' }],
    };
  }
  const result = await fetchWeather(ctx.location.latitude, ctx.location.longitude);
  if (!result.current) {
    return {
      text: tpl.status.unavailable + ' — ' + (lang === 'te' ? 'వాతావరణ సమాచారం లేదు.' : lang === 'hi' ? 'मौसम जानकारी अनुपलब्ध।' : 'Weather data unavailable.'),
      confidence: null, dataStatus: 'unavailable', sources: [result.source],
      actions: [{ label: tpl.actions.retry, action: 'retry' }, { label: tpl.actions.openSource, link: OFFICIAL_SOURCES.IMD.url }],
    };
  }
  const c = result.current;
  const advisory = (c.rainProbability ?? 0) >= 70
    ? (lang === 'te' ? '\n⚠️ భారీ వర్షం అవకాశం. స్ప్రే ఆలస్యం చేయండి.' : lang === 'hi' ? '\n⚠️ भारी बारिश संभावना। स्प्रे टालें।' : '\n⚠️ Heavy rain likely. Consider delaying spraying.')
    : '';
  const text = lang === 'te'
    ? `వాతావరణం:\nఉష్ణోగ్రత: ${c.temperature}°C\nతేమ: ${c.humidity}%\nపరిస్థితి: ${c.condition}\nగాలి: ${c.windSpeed} km/h${advisory}`
    : lang === 'hi'
    ? `मौसम:\nतापमान: ${c.temperature}°C\nनमी: ${c.humidity}%\nस्थिति: ${c.condition}\nहवा: ${c.windSpeed} km/h${advisory}`
    : `Weather:\nTemperature: ${c.temperature}°C\nHumidity: ${c.humidity}%\nCondition: ${c.condition}\nWind: ${c.windSpeed} km/h${advisory}`;
  return { text, confidence: 'High', dataStatus: 'live', sources: [result.source], actions: [{ label: tpl.actions.viewDetails, link: '/weather' }] };
}

async function routeCropDisease(
  query: string, entities: ExtractedEntities, _ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  const analysis = analyzeCropHealth(entities.crop || '', query, '', '', '', '', '');
  const health = analysis.result;
  if (!health) {
    return {
      text: lang === 'te' ? 'పంట ఆరోగ్య విశ్లేషణ కోసం దయచేసి పంట పేరు మరియు లక్షణాలను ఇవ్వండి.' : lang === 'hi' ? 'फसल स्वास्थ्य विश्लेषण के लिए फसल का नाम और लक्षण बताएं।' : 'Please provide crop name and symptoms for health analysis.',
      confidence: null, dataStatus: 'unavailable', sources: [],
      actions: [{ label: tpl.actions.viewDetails, link: '/crop-health' }],
    };
  }
  const lines = [
    lang === 'te' ? `సమస్య: ${health.possibleProblem}` : lang === 'hi' ? `समस्या: ${health.possibleProblem}` : `Problem: ${health.possibleProblem}`,
    lang === 'te' ? `కారణం: ${health.possibleCauses.join(', ')}` : lang === 'hi' ? `संभावित कारण: ${health.possibleCauses.join(', ')}` : `Possible reason: ${health.possibleCauses.join(', ')}`,
    lang === 'te' ? 'చేయగలిగినది:' : lang === 'hi' ? 'आप क्या कर सकते हैं:' : 'What you can do:',
    ...health.whatToDoNow.map((s, i) => `${i + 1}. ${s}`),
    '',
    tpl.disclaimer.notDiagnosis,
  ];
  if (health.confidence === 'Low') lines.push(tpl.disclaimer.verifyWithOfficer);
  return {
    text: lines.join('\n'),
    confidence: health.confidence,
    dataStatus: health.confidence === 'Low' ? 'low' : 'ai',
    sources: [{
      sourceName: OFFICIAL_SOURCES.ICAR.name, sourceUrl: OFFICIAL_SOURCES.ICAR.url,
      sourceType: 'AI', isLive: false, isVerified: false,
      lastUpdated: formatLastUpdated(new Date()), status: 'available',
    }],
    actions: [{ label: tpl.actions.viewDetails, link: '/crop-health' }, { label: tpl.actions.contactSupport, link: '/support' }],
  };
}

async function routeGovernmentScheme(
  _q: string, _e: ExtractedEntities, _ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  const schemes = getKnownSchemes().slice(0, 3);
  const lines = schemes.map(s => `${s.name}\n  ${s.benefits}\n  ${lang === 'te' ? 'అర్హత: ' : lang === 'hi' ? 'पात्रता: ' : 'Eligibility: '}${s.eligibility}`).join('\n\n');
  return {
    text: (lang === 'te' ? 'ప్రభుత్వ పథకాలు:\n\n' : lang === 'hi' ? 'सरकारी योजनाएं:\n\n' : 'Government schemes:\n\n') + lines,
    confidence: 'High', dataStatus: 'verified',
    sources: [{ sourceName: OFFICIAL_SOURCES.MYSCHEME.name, sourceUrl: OFFICIAL_SOURCES.MYSCHEME.url, sourceType: 'OFFICIAL', isLive: false, isVerified: true, lastUpdated: formatLastUpdated(new Date()), status: 'available' }],
    actions: [{ label: tpl.actions.viewDetails, link: '/schemes' }],
  };
}

async function routeCropBuyer(
  _q: string, _e: ExtractedEntities, _ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  const routes = getSellCropRoutes();
  const lines = routes.map((r, i) => `${i + 1}. ${r.title}: ${r.description}`).join('\n');
  return {
    text: (lang === 'te' ? 'పంటను అమ్మడానికి మార్గాలు:\n\n' : lang === 'hi' ? 'फसल बेचने के तरीके:\n\n' : 'Ways to sell your crop:\n\n') + lines,
    confidence: 'High', dataStatus: 'verified',
    sources: [{ sourceName: OFFICIAL_SOURCES.ENAM.name, sourceUrl: OFFICIAL_SOURCES.ENAM.url, sourceType: 'OFFICIAL', isLive: false, isVerified: true, lastUpdated: formatLastUpdated(new Date()), status: 'available' }],
    actions: [{ label: tpl.actions.viewDetails, link: '/sell-crop' }, { label: tpl.actions.openSource, link: OFFICIAL_SOURCES.ENAM.url }],
  };
}

async function routeCropProfit(
  _q: string, _e: ExtractedEntities, _ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  return {
    text: lang === 'te' ? 'లాభ అంచనా కోసం దయచేసి లాభ కాలిక్యులేటర్ పేజీని ఉపయోగించండి. మీ ఖర్చులు మరియు ఆదాయాన్ని ఇవ్వండి.' : lang === 'hi' ? 'लाभ अनुमान के लिए लाभ कैलकुलेटर पेज का उपयोग करें। अपना खर्च और आय दर्ज करें।' : 'Please use the Profit Calculator page to enter your costs and expected revenue for an estimate.',
    confidence: 'Medium', dataStatus: 'estimate', sources: [],
    actions: [{ label: tpl.actions.viewDetails, link: '/profit' }],
  };
}

async function routeCropRecommendation(
  _q: string, _e: ExtractedEntities, ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  const recs = getCropRecommendations({
    state: ctx.location?.state || '',
    district: ctx.location?.district || '',
    season: 'auto',
    waterAvailability: 'moderate',
    budget: 'medium',
    soilType: null,
    soilPh: null,
    cropPreference: _e.crop,
    previousCrop: null,
    hasSoilData: false,
  });
  const top3 = recs.recommendations.slice(0, 3);
  if (top3.length === 0) {
    return {
      text: lang === 'te' ? 'పంట సిఫారసు కోసం దయచేసి పంట సిఫారసు పేజీని ఉపయోగించండి.' : 'Please use the Crop Recommendation page for personalized suggestions.',
      confidence: 'Medium', dataStatus: 'ai', sources: [],
      actions: [{ label: tpl.actions.viewDetails, link: '/crop-recommendation' }],
    };
  }
  const lines = top3.map(r => `${r.crop} (${r.suitability}% ${lang === 'te' ? 'సరిపోతుంది' : 'suitable'}) — ${r.why}`).join('\n');
  return {
    text: (lang === 'te' ? 'సిఫారసు చేసిన పంటలు:\n\n' : lang === 'hi' ? 'अनुशंसित फसलें:\n\n' : 'Recommended crops:\n\n') + lines,
    confidence: 'Medium', dataStatus: 'ai', sources: [],
    actions: [{ label: tpl.actions.viewDetails, link: '/crop-recommendation' }],
  };
}

async function routeGeneral(
  query: string, entities: ExtractedEntities, _ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl,
): Promise<AIResponse> {
  const knowledge = getAgricultureKnowledge(entities.crop || '', query);
  const greeting = tpl.greeting;
  const capabilities = lang === 'te'
    ? 'నేను ఈ కింది వాటిలో సహాయం చేయగలను:\n- మార్కెట్ ధరలు\n- వాతావరణం\n- పంట వ్యాధులు\n- ప్రభుత్వ పథకాలు\n- పంట అమ్మకం\n- లాభ అంచనా\n- పంట సిఫారసు'
    : lang === 'hi'
    ? 'मैं इनमें मदद कर सकता हूं:\n- बाजार भाव\n- मौसम\n- फसल रोग\n- सरकारी योजनाएं\n- फसल बिक्री\n- लाभ अनुमान\n- फसल सुझाव'
    : 'I can help with:\n- Market prices\n- Weather\n- Crop diseases\n- Government schemes\n- Selling crops\n- Profit estimation\n- Crop recommendations';
  return {
    text: knowledge ? `${knowledge.title}\n${knowledge.description}\n\nSteps:\n${knowledge.managementSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : `${greeting}\n\n${capabilities}`,
    confidence: 'Medium', dataStatus: 'ai', sources: [],
    actions: [{ label: lang === 'te' ? 'ధరలు చూడండి' : 'Check Market Prices', link: '/market' }, { label: tpl.actions.viewDetails, link: '/talk' }],
  };
}

const ROUTERS: Record<Intent, (q: string, e: ExtractedEntities, ctx: RADEContext, lang: LanguageCode, tpl: ResponseTpl) => Promise<AIResponse>> = {
  MARKET_PRICE: routeMarketPrice,
  WEATHER: routeWeather,
  CROP_DISEASE: routeCropDisease,
  PEST_PROBLEM: routeCropDisease,
  SOIL_ANALYSIS: routeCropRecommendation,
  CROP_RECOMMENDATION: routeCropRecommendation,
  FERTILIZER_INFORMATION: routeGeneral,
  IRRIGATION: routeGeneral,
  GOVERNMENT_SCHEME: routeGovernmentScheme,
  CROP_PROFIT: routeCropProfit,
  CROP_RISK: routeCropProfit,
  CROP_BUYER: routeCropBuyer,
  GENERAL_AGRICULTURE: routeGeneral,
};

export async function processWithRADE(query: string, context: RADEContext): Promise<RADEResult> {
  const processingSteps: string[] = [];
  const detectedLanguage = detectLanguage(query);
  const lang = detectedLanguage as LanguageCode;
  const tpl = getResponseTemplate(lang);

  processingSteps.push(`Language: ${detectedLanguage}`);

  const intentResult = detectIntent(query);
  processingSteps.push(`Intent: ${intentResult.intent}`);

  const entities = extractEntities(query);
  const entityChips = formatEntities(lang, entities);
  processingSteps.push(`Entities: ${entityChips.join(', ') || 'none'}`);

  const router = ROUTERS[intentResult.intent] || routeGeneral;
  let response: AIResponse;
  try {
    response = await router(query, entities, context, lang, tpl);
  } catch {
    response = {
      text: tpl.status.unavailable,
      confidence: null, dataStatus: 'unavailable', sources: [],
      actions: [{ label: tpl.actions.retry, action: 'retry' }],
    };
  }

  const freshness = response.sources.length > 0 && response.sources[0].lastUpdated
    ? validateFreshness(response.sources[0].lastUpdated) : null;

  if (freshness?.warning) {
    response.text += `\n\n⚠️ ${freshness.warning}`;
  }

  return { response, intent: intentResult.intent, intentResult, entities, freshness, detectedLanguage, processingSteps };
}
