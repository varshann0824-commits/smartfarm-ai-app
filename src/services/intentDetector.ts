export type Intent =
  | 'MARKET_PRICE'
  | 'WEATHER'
  | 'CROP_DISEASE'
  | 'PEST_PROBLEM'
  | 'SOIL_ANALYSIS'
  | 'CROP_RECOMMENDATION'
  | 'FERTILIZER_INFORMATION'
  | 'IRRIGATION'
  | 'GOVERNMENT_SCHEME'
  | 'CROP_PROFIT'
  | 'CROP_RISK'
  | 'CROP_BUYER'
  | 'GENERAL_AGRICULTURE';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  matchedKeywords: string[];
}

interface IntentKeyword {
  intent: Intent;
  keywords: string[];
  weight: number;
}

const INTENT_KEYWORDS: IntentKeyword[] = [
  {
    intent: 'MARKET_PRICE',
    weight: 1.0,
    keywords: [
      'price', 'prices', 'mandi', 'market', 'rate', 'rates', 'bajarat',
      'today price', 'market price', 'modal price', 'mandi rate',
      'ధర', 'మార్కెట్', 'మండి', 'రేటు',
      'कीमत', 'मंडी', 'बाजार', 'दर', 'भाव',
      'விலை', 'சந்தை', 'மண்டி',
      'ಬೆಲೆ', 'ಮಾರುಕಟ್ಟೆ', 'ಮಂಡಿ',
      'വില', 'മാർക്കറ്റ്', 'മണ്ഡി',
      'भाव', 'बाजारभाव', 'दर',
    ],
  },
  {
    intent: 'WEATHER',
    weight: 1.0,
    keywords: [
      'weather', 'rain', 'temperature', 'climate', 'forecast', 'humidity', 'wind',
      'mausam', 'barish', 'garmi', 'sardi', 'baarish',
      'వాతావరణం', 'వర్షం', 'ఉష్ణోగ్రత', 'గాలి',
      'मौसम', 'बारिश', 'तापमान', 'गर्मी', 'ठंड',
      'வானிலை', 'மழை', 'வெப்பநிலை',
      'ಹವಾಮಾನ', 'ಮಳೆ', 'ತಾಪಮಾನ',
      'കാലവസ്ഥ', 'മഴ', 'താപനില',
    ],
  },
  {
    intent: 'CROP_DISEASE',
    weight: 1.0,
    keywords: [
      'disease', 'sick', 'yellow leaf', 'spot', 'spots', 'rot', 'wilt', 'fungus',
      'blight', 'rust', 'mildew', 'mold', 'yellow', 'brown', 'dry', 'dying',
      'leaf curl', 'leaf spot', 'powdery', 'downy',
      'వ్యాధి', 'ఆకులు పసుపు', 'మచ్చలు', 'కుళ్ళు', 'తెగులు',
      'बीमारी', 'पीला पत्ता', 'धब्बे', 'सड़ना', 'फंगस', 'कीट',
      'நோய்', 'மஞ்சள் இலை', 'புள்ளிகள்', 'அழுகல்',
      'ರೋಗ', 'ಹಳದಿ ಎಲೆ', 'ಕಲೆಗಳು', 'ಕೊಳೆತ',
      'രോഗം', 'മഞ്ഞ ഇല', 'പാടുകൾ', 'അഴുകൽ',
    ],
  },
  {
    intent: 'PEST_PROBLEM',
    weight: 0.9,
    keywords: [
      'pest', 'insect', 'bug', 'worm', 'aphid', 'thrips', 'mite', 'borer',
      'caterpillar', 'fly', 'whitefly', 'mealybug', 'hopper',
      'పురుగు', 'పురుగులు', 'పురుగుల', 'కీటక',
      'कीड़ा', 'कीट', 'मकोड़ा', 'सुंडी', 'कीटक',
      'பூச்சி', 'பூச்சிகள்', 'புழு',
      'ಕೀಟ', 'ಹುಳು', 'ಬೊದು',
      'പ്രാണി', 'പുഴു', 'ഷഡ്പദം',
    ],
  },
  {
    intent: 'SOIL_ANALYSIS',
    weight: 1.0,
    keywords: [
      'soil', 'soil test', 'soil ph', 'soil type', 'soil health', 'land',
      'nitrogen', 'phosphorus', 'potassium', 'npk', 'fertility',
      'మట్టి', 'మట్టి పరీక్ష', 'మట్టి రకం', 'భూమి',
      'मिट्टी', 'मिट्टी परीक्षण', 'मिट्टी का प्रकार', 'ज़मीन',
      'மண்', 'மண் சோதனை', 'மண் வகை',
      'ಮಣ್ಣು', 'ಮಣ್ಣು ಪರೀಕ್ಷೆ', 'ಮಣ್ಣಿನ ಪ್ರಕಾರ',
      'മണ്ണ്', 'മണ്ണ് പരിശോധന', 'മണ്ണിന്റെ തരം',
    ],
  },
  {
    intent: 'CROP_RECOMMENDATION',
    weight: 1.0,
    keywords: [
      'which crop', 'what crop', 'recommend', 'grow', 'plant', 'cultivate',
      'sow', 'best crop', 'crop for', 'suitable crop', 'what to grow',
      'ఏ పంట', 'ఏమి పండించాలి', 'పంట సిఫారసు', 'నాటడానికి',
      'कौन सी फसल', 'क्या उगाएं', 'फसल सुझाव', 'बोना',
      'எந்த பயிர்', 'என்ன வளர்க்க', 'பயிர் பரிந்துரை',
      'ಯಾವ ಬೆಳೆ', 'ಏನು ಬೆಳೆಯಲಿ', 'ಬೆಳೆ ಶಿಫಾರಸು',
      'ഏത് വിള', 'എന്ത് കൃഷി ചെയ്യണം', 'വിള ശുപാർശ',
    ],
  },
  {
    intent: 'FERTILIZER_INFORMATION',
    weight: 0.9,
    keywords: [
      'fertilizer', 'fertiliser', 'urea', 'dap', 'npk', 'compost', 'manure',
      'organic fertilizer', 'chemical fertilizer', 'nutrient',
      'ఎరువు', 'యూరియా', 'సేంద్రీయ ఎరువు',
      'खाद', 'यूरिया', 'डीएपी', 'जैविक खाद',
      'உரம்', 'யூரியா', 'ஆர்கனிக் உரம்',
      'ಗೊಬ್ಬರ', 'ಯುರಿಯಾ', 'ಸಾವಯವ ಗೊಬ್ಬರ',
      'വളം', 'യൂറിയ', 'ജൈവ വളം',
    ],
  },
  {
    intent: 'IRRIGATION',
    weight: 0.9,
    keywords: [
      'irrigation', 'water', 'watering', 'drip', 'sprinkler', 'flood irrigation',
      'water supply', 'water need', 'water requirement', 'watering schedule',
      'నీటి పారుదల', 'నీరు', 'నీటి అవసరం', 'డ్రిప్',
      'सिंचाई', 'पानी', 'जल', 'ड्रिप',
      'நீர்ப்பாசனம்', 'தண்ணீர்', 'நீர் தேவை',
      'ನೀರಾವರಿ', 'ನೀರು', 'ನೀರಿನ ಅಗತ್ಯ',
      'ജലസേചനം', 'വെള്ളം', 'വെള്ളത്തിന്റെ ആവശ്യം',
    ],
  },
  {
    intent: 'GOVERNMENT_SCHEME',
    weight: 1.0,
    keywords: [
      'scheme', 'yojana', 'government', 'benefit', 'subsidy', 'pm-kisan', 'pmkisan',
      'insurance', 'pmfby', 'kcc', 'loan', 'scheme available', 'government help',
      'పథకం', 'ప్రభుత్వం', 'సబ్సిడీ', 'ప్రయోజనం',
      'योजना', 'सरकार', 'सब्सिडी', 'लाभ', 'प्रधानमंत्री',
      'திட்டம்', 'அரசு', 'மானியம்', 'பயன்',
      'ಯೋಜನೆ', 'ಸರ್ಕಾರ', 'ಸಬ್ಸಿಡಿ', 'ಪ್ರಯೋಜನ',
      'പദ്ധതി', 'സർക്കാർ', 'സബ്സിഡി', 'പ്രയോജനം',
    ],
  },
  {
    intent: 'CROP_PROFIT',
    weight: 1.0,
    keywords: [
      'profit', 'cost', 'revenue', 'income', 'expense', 'economics',
      'profit calculation', 'cost of farming', 'return',
      'లాభం', 'ఖర్చు', 'ఆదాయం', 'లెక్క',
      'लाभ', 'खर्च', 'आय', 'मुनाफा', 'लागत',
      'லாபம்', 'செலவு', 'வருவாய்', 'கணக்கு',
      'ಲಾಭ', 'ಖರ್ಚು', 'ಆದಾಯ', 'ಲೆಕ್ಕಾಚಾರ',
      'ലാഭം', 'ചെലവ്', 'വരുമാനം', 'കണക്ക്',
    ],
  },
  {
    intent: 'CROP_BUYER',
    weight: 1.0,
    keywords: [
      'sell', 'buy', 'buyer', 'enam', 'e-nam', 'apmc', 'procurement',
      'where to sell', 'who buys', 'sell crop', 'bech', 'sell my',
      'అమ్మండి', 'కొనుగోలుదారు', 'అమ్మకం', 'e-nam',
      'बेचना', 'खरीदार', 'बिक्री', 'बेच',
      'விற்க', 'வாங்குபவர்', 'விற்பனை',
      'ಮಾರಿ', 'ಖರೀದಿದಾರ', 'ಮಾರಾಟ',
      'വിൽക്കാൻ', 'വാങ്ങുന്നവൻ', 'വിൽപ്പന',
    ],
  },
];

export function detectIntent(query: string): IntentResult {
  const lower = query.toLowerCase().trim();
  if (!lower) {
    return { intent: 'GENERAL_AGRICULTURE', confidence: 0, matchedKeywords: [] };
  }

  const scores = new Map<Intent, { score: number; keywords: string[] }>();

  for (const entry of INTENT_KEYWORDS) {
    let score = 0;
    const matched: string[] = [];
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += entry.weight;
        matched.push(kw);
      }
    }
    if (score > 0) {
      scores.set(entry.intent, { score, keywords: matched });
    }
  }

  if (scores.size === 0) {
    return { intent: 'GENERAL_AGRICULTURE', confidence: 0, matchedKeywords: [] };
  }

  let bestIntent: Intent = 'GENERAL_AGRICULTURE';
  let bestScore = 0;
  let bestKeywords: string[] = [];

  for (const [intent, { score, keywords }] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
      bestKeywords = keywords;
    }
  }

  const confidence = Math.min(bestScore / 2, 1.0);
  return { intent: bestIntent, confidence, matchedKeywords: bestKeywords };
}
