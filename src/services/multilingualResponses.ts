import type { Intent } from './intentDetector';
import type { ExtractedEntities } from './entityExtractor';
import type { FreshnessLevel } from './freshnessValidator';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr';

interface ResponseTemplate {
  greeting: string;
  intentLabels: Record<Intent, string>;
  entityLabels: {
    crop: string;
    disease: string;
    pest: string;
    location: string;
    district: string;
    state: string;
    soilType: string;
    quantity: string;
  };
  freshness: {
    FRESH: string;
    RECENT: string;
    STALE: string;
    UNAVAILABLE: string;
  };
  followUp: {
    askCrop: string;
    askLocation: string;
    askDetails: string;
  };
  status: {
    available: string;
    unavailable: string;
    partial: string;
  };
  actions: {
    retry: string;
    openSource: string;
    viewDetails: string;
    contactSupport: string;
  };
  disclaimer: {
    aiPrediction: string;
    notDiagnosis: string;
    verifyWithOfficer: string;
  };
}

const TEMPLATES: Record<LanguageCode, ResponseTemplate> = {
  en: {
    greeting: 'Hello! I am SmartFarm AI. How can I help you today?',
    intentLabels: {
      MARKET_PRICE: 'Market Price',
      WEATHER: 'Weather',
      CROP_DISEASE: 'Crop Disease',
      PEST_PROBLEM: 'Pest Problem',
      SOIL_ANALYSIS: 'Soil Analysis',
      CROP_RECOMMENDATION: 'Crop Recommendation',
      FERTILIZER_INFORMATION: 'Fertilizer Information',
      IRRIGATION: 'Irrigation',
      GOVERNMENT_SCHEME: 'Government Scheme',
      CROP_PROFIT: 'Profit Analysis',
      CROP_RISK: 'Crop Risk',
      CROP_BUYER: 'Crop Buyer',
      GENERAL_AGRICULTURE: 'General Agriculture',
    },
    entityLabels: {
      crop: 'Crop',
      disease: 'Disease',
      pest: 'Pest',
      location: 'Location',
      district: 'District',
      state: 'State',
      soilType: 'Soil Type',
      quantity: 'Quantity',
    },
    freshness: {
      FRESH: 'Fresh data',
      RECENT: 'Recent data',
      STALE: 'Data may be outdated',
      UNAVAILABLE: 'Data unavailable',
    },
    followUp: {
      askCrop: 'Which crop are you asking about?',
      askLocation: 'Which location or district?',
      askDetails: 'Can you provide more details?',
    },
    status: {
      available: 'Available',
      unavailable: 'Currently unavailable',
      partial: 'Partially available',
    },
    actions: {
      retry: 'Try Again',
      openSource: 'Open Official Source',
      viewDetails: 'View Details',
      contactSupport: 'Contact Agricultural Support',
    },
    disclaimer: {
      aiPrediction: 'AI Prediction — Not Guaranteed',
      notDiagnosis: 'This is an AI-assisted identification, not a confirmed diagnosis. Please verify with a qualified agricultural officer.',
      verifyWithOfficer: 'If the problem persists, please contact your nearest agricultural officer or Rythu Bharosa Kendra.',
    },
  },
  te: {
    greeting: 'నమస్కారం! నేను స్మార్ట్‌ఫామ్ AI. నేను మీకు ఎలా సహాయం చేయగలను?',
    intentLabels: {
      MARKET_PRICE: 'మార్కెట్ ధర',
      WEATHER: 'వాతావరణం',
      CROP_DISEASE: 'పంట వ్యాధి',
      PEST_PROBLEM: 'పురుగు సమస్య',
      SOIL_ANALYSIS: 'మట్టి విశ్లేషణ',
      CROP_RECOMMENDATION: 'పంట సిఫారసు',
      FERTILIZER_INFORMATION: 'ఎరువు సమాచారం',
      IRRIGATION: 'నీటి పారుదల',
      GOVERNMENT_SCHEME: 'ప్రభుత్వ పథకం',
      CROP_PROFIT: 'లాభ విశ్లేషణ',
      CROP_RISK: 'పంట ప్రమాదం',
      CROP_BUYER: 'పంట కొనుగోలుదారు',
      GENERAL_AGRICULTURE: 'సాధారణ వ్యవసాయం',
    },
    entityLabels: {
      crop: 'పంట',
      disease: 'వ్యాధి',
      pest: 'పురుగు',
      location: 'ప్రాంతం',
      district: 'జిల్లా',
      state: 'రాష్ట్రం',
      soilType: 'మట్టి రకం',
      quantity: 'పరిమాణం',
    },
    freshness: {
      FRESH: 'తాజా సమాచారం',
      RECENT: 'ఇటీవలి సమాచారం',
      STALE: 'సమాచారం పాతది అవ్వొచ్చు',
      UNAVAILABLE: 'సమాచారం అందుబాటులో లేదు',
    },
    followUp: {
      askCrop: 'మీరు ఏ పంట గురించి అడుగుతున్నారు?',
      askLocation: 'ఏ ప్రాంతం లేదా జిల్లా?',
      askDetails: 'మరింత వివరాలు ఇవ్వగలరా?',
    },
    status: {
      available: 'అందుబాటులో ఉంది',
      unavailable: 'ప్రస్తుతం అందుబాటులో లేదు',
      partial: 'పాక్షికంగా అందుబాటులో ఉంది',
    },
    actions: {
      retry: 'మళ్లీ ప్రయత్నించండి',
      openSource: 'అధికారిక మూలం తెరవండి',
      viewDetails: 'వివరాలు చూడండి',
      contactSupport: 'వ్యవసాయ సహాయానికి సంప్రదించండి',
    },
    disclaimer: {
      aiPrediction: 'AI అంచనా — హామీ లేదు',
      notDiagnosis: 'ఇది AI సహాయంతో గుర్తింపు, నిర్ధారిత రోగ నిర్ణయం కాదు. దయచేసి అర్హత కలిగిన వ్యవసాయ అధికారిని సంప్రదించండి.',
      verifyWithOfficer: 'సమస్య కొనసాగితే, దయచేసి మీ సమీపంలోని వ్యవసాయ అధికారిని లేదా రైతు భరోసా కేంద్రాన్ని సంప్రదించండి.',
    },
  },
  hi: {
    greeting: 'नमस्ते! मैं स्मार्टफार्म AI हूं। मैं आपकी कैसे मदद कर सकता हूं?',
    intentLabels: {
      MARKET_PRICE: 'बाजार भाव',
      WEATHER: 'मौसम',
      CROP_DISEASE: 'फसल रोग',
      PEST_PROBLEM: 'कीट समस्या',
      SOIL_ANALYSIS: 'मिट्टी विश्लेषण',
      CROP_RECOMMENDATION: 'फसल सुझाव',
      FERTILIZER_INFORMATION: 'खाद जानकारी',
      IRRIGATION: 'सिंचाई',
      GOVERNMENT_SCHEME: 'सरकारी योजना',
      CROP_PROFIT: 'लाभ विश्लेषण',
      CROP_RISK: 'फसल जोखिम',
      CROP_BUYER: 'फसल खरीदार',
      GENERAL_AGRICULTURE: 'सामान्य कृषि',
    },
    entityLabels: {
      crop: 'फसल',
      disease: 'रोग',
      pest: 'कीट',
      location: 'स्थान',
      district: 'ज़िला',
      state: 'राज्य',
      soilType: 'मिट्टी का प्रकार',
      quantity: 'मात्रा',
    },
    freshness: {
      FRESH: 'ताज़ा डेटा',
      RECENT: 'हाल का डेटा',
      STALE: 'डेटा पुराना हो सकता है',
      UNAVAILABLE: 'डेटा अनुपलब्ध',
    },
    followUp: {
      askCrop: 'आप किस फसल के बारे में पूछ रहे हैं?',
      askLocation: 'कौन सा स्थान या ज़िला?',
      askDetails: 'क्या आप और विवरण दे सकते हैं?',
    },
    status: {
      available: 'उपलब्ध',
      unavailable: 'वर्तमान में अनुपलब्ध',
      partial: 'आंशिक रूप से उपलब्ध',
    },
    actions: {
      retry: 'पुनः प्रयास करें',
      openSource: 'आधिकारिक स्रोत खोलें',
      viewDetails: 'विवरण देखें',
      contactSupport: 'कृषि सहायता से संपर्क करें',
    },
    disclaimer: {
      aiPrediction: 'AI अनुमान — गारंटी नहीं',
      notDiagnosis: 'यह AI सहायता से पहचान है, पुष्टि की गई निदान नहीं है। कृपया एक योग्य कृषि अधिकारी से सत्यापित करें।',
      verifyWithOfficer: 'यदि समस्या बनी रहती है, तो कृपया अपने निकटतम कृषि अधिकारी से संपर्क करें।',
    },
  },
  ta: {
    greeting: 'வணக்கம்! நான் ஸ்மார்ட்ஃபாம் AI. நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    intentLabels: {
      MARKET_PRICE: 'சந்தை விலை',
      WEATHER: 'வானிலை',
      CROP_DISEASE: 'பயிர் நோய்',
      PEST_PROBLEM: 'பூச்சி பிரச்சனை',
      SOIL_ANALYSIS: 'மண் ஆய்வு',
      CROP_RECOMMENDATION: 'பயிர் பரிந்துரை',
      FERTILIZER_INFORMATION: 'உர தகவல்',
      IRRIGATION: 'நீர்ப்பாசனம்',
      GOVERNMENT_SCHEME: 'அரசு திட்டம்',
      CROP_PROFIT: 'லாப பகுப்பாய்வு',
      CROP_RISK: 'பயிர் ஆபத்து',
      CROP_BUYER: 'பயிர் வாங்குபவர்',
      GENERAL_AGRICULTURE: 'பொது வேளாண்மை',
    },
    entityLabels: {
      crop: 'பயிர்',
      disease: 'நோய்',
      pest: 'பூச்சி',
      location: 'இடம்',
      district: 'மாவட்டம்',
      state: 'மாநிலம்',
      soilType: 'மண் வகை',
      quantity: 'அளவு',
    },
    freshness: {
      FRESH: 'புதிய தரவு',
      RECENT: 'சமீபத்திய தரவு',
      STALE: 'தரவு பழையதாக இருக்கலாம்',
      UNAVAILABLE: 'தரவு கிடைக்கவில்லை',
    },
    followUp: {
      askCrop: 'நீங்கள் எந்த பயிரைப் பற்றி கேட்கிறீர்கள்?',
      askLocation: 'எந்த இடம் அல்லது மாவட்டம்?',
      askDetails: 'மேலும் விவரங்களை வழங்க முடியுமா?',
    },
    status: {
      available: 'கிடைக்கிறது',
      unavailable: 'தற்போது கிடைக்கவில்லை',
      partial: 'பகுதியாக கிடைக்கிறது',
    },
    actions: {
      retry: 'மீண்டும் முயற்சிக்கவும்',
      openSource: 'அதிகாரப்பூர்வ மூலத்தைத் திறக்கவும்',
      viewDetails: 'விவரங்களைக் காண்க',
      contactSupport: 'வேளாண் உதவியைத் தொடர்பு கொள்ளவும்',
    },
    disclaimer: {
      aiPrediction: 'AI கணிப்பு — உத்தரவாதம் இல்லை',
      notDiagnosis: 'இது AI உதவியுடன் அடையாளம் காணப்பட்டது, உறுதிசெய்யப்பட்ட நோயறிதல் அல்ல. தகுதியான வேளாண் அதிகாரியிடம் சரிபார்க்கவும்.',
      verifyWithOfficer: 'பிரச்சனை தொடர்ந்தால், உங்கள் அருகிலுள்ள வேளாண் அதிகாரியைத் தொடர்பு கொள்ளவும்.',
    },
  },
  kn: {
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ಸ್ಮಾರ್ಟ್‌ಫಾರ್ಮ್ AI. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    intentLabels: {
      MARKET_PRICE: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ',
      WEATHER: 'ಹವಾಮಾನ',
      CROP_DISEASE: 'ಬೆಳೆ ರೋಗ',
      PEST_PROBLEM: 'ಕೀಟ ಸಮಸ್ಯೆ',
      SOIL_ANALYSIS: 'ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ',
      CROP_RECOMMENDATION: 'ಬೆಳೆ ಶಿಫಾರಸು',
      FERTILIZER_INFORMATION: 'ಗೊಬ್ಬರ ಮಾಹಿತಿ',
      IRRIGATION: 'ನೀರಾವರಿ',
      GOVERNMENT_SCHEME: 'ಸರ್ಕಾರಿ ಯೋಜನೆ',
      CROP_PROFIT: 'ಲಾಭ ವಿಶ್ಲೇಷಣೆ',
      CROP_RISK: 'ಬೆಳೆ ಅಪಾಯ',
      CROP_BUYER: 'ಬೆಳೆ ಖರೀದಿದಾರ',
      GENERAL_AGRICULTURE: 'ಸಾಮಾನ್ಯ ಕೃಷಿ',
    },
    entityLabels: {
      crop: 'ಬೆಳೆ',
      disease: 'ರೋಗ',
      pest: 'ಕೀಟ',
      location: 'ಸ್ಥಳ',
      district: 'ಜಿಲ್ಲೆ',
      state: 'ರಾಜ್ಯ',
      soilType: 'ಮಣ್ಣಿನ ಪ್ರಕಾರ',
      quantity: 'ಪ್ರಮಾಣ',
    },
    freshness: {
      FRESH: 'ತಾಜಾ ಡೇಟಾ',
      RECENT: 'ಇತ್ತೀಚಿನ ಡೇಟಾ',
      STALE: 'ಡೇಟಾ ಹಳತಾಗಿರಬಹುದು',
      UNAVAILABLE: 'ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ',
    },
    followUp: {
      askCrop: 'ನೀವು ಯಾವ ಬೆಳೆಯ ಬಗ್ಗೆ ಕೇಳುತ್ತಿದ್ದೀರಿ?',
      askLocation: 'ಯಾವ ಸ್ಥಳ ಅಥವಾ ಜಿಲ್ಲೆ?',
      askDetails: 'ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ನೀಡಬಹುದೇ?',
    },
    status: {
      available: 'ಲಭ್ಯ',
      unavailable: 'ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ',
      partial: 'ಭಾಗಶಃ ಲಭ್ಯ',
    },
    actions: {
      retry: 'ಮರುಪ್ರಯತ್ನಿಸಿ',
      openSource: 'ಅಧಿಕೃತ ಮೂಲ ತೆರೆಯಿರಿ',
      viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
      contactSupport: 'ಕೃಷಿ ಸಹಾಯಕ್ಕಾಗಿ ಸಂಪರ್ಕಿಸಿ',
    },
    disclaimer: {
      aiPrediction: 'AI ಅಂದಾಜು — ಖಾತ್ರಿ ಇಲ್ಲ',
      notDiagnosis: 'ಇದು AI ಸಹಾಯದಿಂದ ಗುರುತಿಸುವಿಕೆ, ದೃಢೀಕರಿಸಲಾದ ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ತರಬೇತಿ ಪಡೆದ ಕೃಷಿ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.',
      verifyWithOfficer: 'ಸಮಸ್ಯೆ ಮುಂದುವರಿದರೆ, ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹತ್ತಿರದ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    },
  },
  ml: {
    greeting: 'നമസ്കാരം! ഞാൻ സ്മാർട്ട്ഫാം AI ആണ്. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?',
    intentLabels: {
      MARKET_PRICE: 'മാർക്കറ്റ് വില',
      WEATHER: 'കാലവസ്ഥ',
      CROP_DISEASE: 'വിള രോഗം',
      PEST_PROBLEM: 'പ്രാണി പ്രശ്നം',
      SOIL_ANALYSIS: 'മണ്ണ് വിശകലനം',
      CROP_RECOMMENDATION: 'വിള ശുപാർശ',
      FERTILIZER_INFORMATION: 'വള വിവരം',
      IRRIGATION: 'ജലസേചനം',
      GOVERNMENT_SCHEME: 'സർക്കാർ പദ്ധതി',
      CROP_PROFIT: 'ലാഭ വിശകലനം',
      CROP_RISK: 'വിള അപകടം',
      CROP_BUYER: 'വിള വാങ്ങുന്നവൻ',
      GENERAL_AGRICULTURE: 'പൊതു കാർഷികം',
    },
    entityLabels: {
      crop: 'വിള',
      disease: 'രോഗം',
      pest: 'പ്രാണി',
      location: 'സ്ഥലം',
      district: 'ജില്ല',
      state: 'സംസ്ഥാനം',
      soilType: 'മണ്ണിന്റെ തരം',
      quantity: 'അളവ്',
    },
    freshness: {
      FRESH: 'പുതിയ ഡാറ്റ',
      RECENT: 'സമീപകാല ഡാറ്റ',
      STALE: 'ഡാറ്റ പഴയതായേക്കാം',
      UNAVAILABLE: 'ഡാറ്റ ലഭ്യമല്ല',
    },
    followUp: {
      askCrop: 'ഏത് വിളയെക്കുറിച്ചാണ് നിങ്ങൾ ചോദിക്കുന്നത്?',
      askLocation: 'ഏത് സ്ഥലം അല്ലെങ്കിൽ ജില്ല?',
      askDetails: 'കൂടുതൽ വിവരങ്ങൾ നൽകാമോ?',
    },
    status: {
      available: 'ലഭ്യമാണ്',
      unavailable: 'നിലവിൽ ലഭ്യമല്ല',
      partial: 'ഭാഗികമായി ലഭ്യമാണ്',
    },
    actions: {
      retry: 'വീണ്ടും ശ്രമിക്കുക',
      openSource: 'ഔദ്യോഗിക ഉറവിടം തുറക്കുക',
      viewDetails: 'വിശദാംശങ്ങൾ കാണുക',
      contactSupport: 'കാർഷിക സഹായവുമായി ബന്ധപ്പെടുക',
    },
    disclaimer: {
      aiPrediction: 'AI പ്രവചനം — ഉറപ്പില്ല',
      notDiagnosis: 'ഇത് AI സഹായത്തോടെയുള്ള തിരിച്ചറിയലാണ്, സ്ഥിരീകരിച്ച രോഗനിർണ്ണയമല്ല. യോഗ്യതയുള്ള കാർഷിക ഉദ്യോഗസ്ഥനെ സമീപിക്കുക.',
      verifyWithOfficer: 'പ്രശ്നം തുടരുകയാണെങ്കിൽ, നിങ്ങളുടെ അടുത്തുള്ള കാർഷിക ഉദ്യോഗസ്ഥനെ ബന്ധപ്പെടുക.',
    },
  },
  mr: {
    greeting: 'नमस्कार! मी स्मार्टफार्म AI आहे. मी तुमची कशी मदत करू शकतो?',
    intentLabels: {
      MARKET_PRICE: 'बाजार भाव',
      WEATHER: 'हवामान',
      CROP_DISEASE: 'पीक रोग',
      PEST_PROBLEM: 'कीड विचार',
      SOIL_ANALYSIS: 'माती विश्लेषण',
      CROP_RECOMMENDATION: 'पीक शिफारस',
      FERTILIZER_INFORMATION: 'खत माहिती',
      IRRIGATION: 'सिंचन',
      GOVERNMENT_SCHEME: 'शासकीय योजना',
      CROP_PROFIT: 'नफा विश्लेषण',
      CROP_RISK: 'पीक धोका',
      CROP_BUYER: 'पीक खरेदीदार',
      GENERAL_AGRICULTURE: 'सामान्य शेती',
    },
    entityLabels: {
      crop: 'पीक',
      disease: 'रोग',
      pest: 'कीड',
      location: 'स्थान',
      district: 'जिल्हा',
      state: 'राज्य',
      soilType: 'मातीचा प्रकार',
      quantity: 'प्रमाण',
    },
    freshness: {
      FRESH: 'ताजा डेटा',
      RECENT: 'अलीकडील डेटा',
      STALE: 'डेटा जुना असू शकतो',
      UNAVAILABLE: 'डेटा उपलब्ध नाही',
    },
    followUp: {
      askCrop: 'तुम्ही कोणत्या पिकाबद्दल विचारत आहात?',
      askLocation: 'कोणते स्थान किंवा जिल्हा?',
      askDetails: 'अधिक तपशील देऊ शकता का?',
    },
    status: {
      available: 'उपलब्ध',
      unavailable: 'सध्या उपलब्ध नाही',
      partial: 'अंशतः उपलब्ध',
    },
    actions: {
      retry: 'पुन्हा प्रयत्न करा',
      openSource: 'अधिकृत स्रोत उघडा',
      viewDetails: 'तपशील पहा',
      contactSupport: 'कृषी मदतीसाठी संपर्क करा',
    },
    disclaimer: {
      aiPrediction: 'AI अंदाज — हमी नाही',
      notDiagnosis: 'ही AI सहाय्याने ओळख आहे, निश्चित निदान नाही. कृपया पात्र कृषी अधिकाऱ्याकडे तपासणी करा.',
      verifyWithOfficer: 'समस्या टिकून राहिल्यास, कृपया जवळच्या कृषी अधिकाऱ्याला संपर्क करा.',
    },
  },
};

export function getResponseTemplate(lang: string): ResponseTemplate {
  const code = (lang in TEMPLATES ? lang : 'en') as LanguageCode;
  return TEMPLATES[code];
}

export function formatFreshnessLabel(lang: string, level: FreshnessLevel): string {
  const tpl = getResponseTemplate(lang);
  return tpl.freshness[level];
}

export function formatIntentLabel(lang: string, intent: Intent): string {
  const tpl = getResponseTemplate(lang);
  return tpl.intentLabels[intent] || intent;
}

export function formatEntityLabel(lang: string, entity: keyof ResponseTemplate['entityLabels']): string {
  const tpl = getResponseTemplate(lang);
  return tpl.entityLabels[entity];
}

export function formatEntities(lang: string, entities: ExtractedEntities): string[] {
  const tpl = getResponseTemplate(lang);
  const chips: string[] = [];
  if (entities.crop) chips.push(`${tpl.entityLabels.crop}: ${entities.crop}`);
  if (entities.disease) chips.push(`${tpl.entityLabels.disease}: ${entities.disease}`);
  if (entities.pest) chips.push(`${tpl.entityLabels.pest}: ${entities.pest}`);
  if (entities.district) chips.push(`${tpl.entityLabels.district}: ${entities.district}`);
  if (entities.state) chips.push(`${tpl.entityLabels.state}: ${entities.state}`);
  if (entities.soilType) chips.push(`${tpl.entityLabels.soilType}: ${entities.soilType}`);
  if (entities.quantity) chips.push(`${tpl.entityLabels.quantity}: ${entities.quantity}`);
  return chips;
}

export { TEMPLATES };
export type { ResponseTemplate };
