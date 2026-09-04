import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { LocationInfo, FarmerDetails } from '@/types';
import { loadLocation, saveLocation, getGPSLocation, reverseGeocode, defaultLocation } from '@/services/geocodingService';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    tagline: 'Helping Indian farmers make better decisions.',
    welcome: 'Welcome to SmartFarm AI',
    chooseLanguage: 'Choose Your Language',
    permissions: 'Permissions',
    talkToAI: 'Talk to SmartFarm AI',
    enterFarmerDetails: 'Enter Farmer Details',
    demoMode: 'Demo Mode',
    home: 'Home',
    market: 'Market',
    talk: 'Talk',
    weather: 'Weather',
    more: 'More',
    back: 'Back',
    dashboard: 'Dashboard',
    myCrop: 'My Crop',
    cropHealth: 'Crop Health',
    marketPrice: 'Market Price',
    sellCrop: 'Sell Crop',
    safety: 'Safety',
    profit: 'Profit',
    schemes: 'Schemes',
    getHelp: 'Get Help',
    soilTest: 'Soil Test',
    settings: 'Settings',
    currentLocation: 'Current Location',
    changeLocation: 'Change Location',
    retry: 'Retry',
    openOfficialSource: 'Open Official Source',
    loading: 'Loading...',
    liveDataUnavailable: 'Live data is temporarily unavailable.',
    viewPrices: 'View Prices',
    checkCropHealth: 'Check Crop Health',
    findBuyers: 'Find Verified Selling Path',
    viewWeather: 'View Weather',
    viewSchemes: 'View Schemes',
    findSupport: 'Find Support',
    checkSoil: 'Check Soil',
    getRecommendation: 'Get Crop Recommendation',
    calculateProfit: 'Calculate Profit',
    todayAdvisor: "Today's Farm Advisor",
    tapToSpeak: 'Tap to Speak',
    typeInstead: 'Type instead',
    listen: 'Listen',
    stop: 'Stop',
    send: 'Send',
  },
  te: {
    tagline: 'భారతీయ రైతులు మెరుగైన నిర్ణయాలు తీసుకోవడంలో సహాయపడటం.',
    welcome: 'స్మార్ట్ ఫార్మ్ AI కి స్వాగతం',
    chooseLanguage: 'మీ భాషను ఎంచుకోండి',
    permissions: 'అనుమతులు',
    talkToAI: 'స్మార్ట్ ఫార్మ్ AI తో మాట్లాడండి',
    enterFarmerDetails: 'రైతు వివరాలు నమోదు చేయండి',
    demoMode: 'డెమో మోడ్',
    home: 'హోమ్',
    market: 'మార్కెట్',
    talk: 'మాట',
    weather: 'వాతావరణం',
    more: 'మరిన్ని',
    back: 'వెనుకకు',
    dashboard: 'డాష్‌బోర్డ్',
    myCrop: 'నా పంట',
    cropHealth: 'పంట ఆరోగ్యం',
    marketPrice: 'మార్కెట్ ధర',
    sellCrop: 'పంట అమ్మండి',
    safety: 'భద్రత',
    profit: 'లాభం',
    schemes: 'పథకాలు',
    getHelp: 'సహాయం పొందండి',
    soilTest: 'మట్టి పరీక్ష',
    settings: 'సెట్టింగులు',
    currentLocation: 'ప్రస్తుత స్థానం',
    changeLocation: 'స్థానం మార్చండి',
    retry: 'మళ్లీ ప్రయత్నించండి',
    openOfficialSource: 'అధికారిక వెబ్‌సైట్ తెరవండి',
    loading: 'లోడ్ అవుతోంది...',
    liveDataUnavailable: 'ప్రత్యక్ష డేటా తాత్కాలికంగా అందుబాటులో లేదు.',
    viewPrices: 'ధరలు చూడండి',
    checkCropHealth: 'పంట ఆరోగ్యం తనిఖీ',
    findBuyers: 'ధృవీకరించబడిన అమ్మకం మార్గాన్ని కనుగొనండి',
    viewWeather: 'వాతావరణం చూడండి',
    viewSchemes: 'పథకాలు చూడండి',
    findSupport: 'సహాయం కనుగొనండి',
    checkSoil: 'మట్టి తనిఖీ',
    getRecommendation: 'పంట సిఫార్సు పొందండి',
    calculateProfit: 'లాభం లెక్కించండి',
    todayAdvisor: 'నేటి వ్యవసాయ సలహా',
    tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    typeInstead: 'బదులుగా టైప్ చేయండి',
    listen: 'వినండి',
    stop: 'ఆపు',
    send: 'పంపండి',
  },
  hi: {
    tagline: 'भारतीय किसानों को बेहतर निर्णय लेने में मदद करना।',
    welcome: 'स्मार्टफार्म AI में आपका स्वागत है',
    chooseLanguage: 'अपनी भाषा चुनें',
    permissions: 'अनुमतियां',
    talkToAI: 'स्मार्टफार्म AI से बात करें',
    enterFarmerDetails: 'किसान विवरण दर्ज करें',
    demoMode: 'डेमो मोड',
    home: 'होम',
    market: 'बाजार',
    talk: 'बात',
    weather: 'मौसम',
    more: 'अधिक',
    back: 'वापस',
    dashboard: 'डैशबोर्ड',
    myCrop: 'मेरी फसल',
    cropHealth: 'फसल स्वास्थ्य',
    marketPrice: 'बाजार भाव',
    sellCrop: 'फसल बेचें',
    safety: 'सुरक्षा',
    profit: 'लाभ',
    schemes: 'योजनाएं',
    getHelp: 'सहायता प्राप्त करें',
    soilTest: 'मिट्टी परीक्षण',
    settings: 'सेटिंग्स',
    currentLocation: 'वर्तमान स्थान',
    changeLocation: 'स्थान बदलें',
    retry: 'पुनः प्रयास करें',
    openOfficialSource: 'आधिकारिक स्रोत खोलें',
    loading: 'लोड हो रहा है...',
    liveDataUnavailable: 'लाइव डेटा अस्थायी रूप से अनुपलब्ध है।',
    viewPrices: 'भाव देखें',
    checkCropHealth: 'फसल स्वास्थ्य जांचें',
    findBuyers: 'सत्यापित बिक्री मार्ग खोजें',
    viewWeather: 'मौसम देखें',
    viewSchemes: 'योजनाएं देखें',
    findSupport: 'सहायता खोजें',
    checkSoil: 'मिट्टी जांचें',
    getRecommendation: 'फसल सिफारिश प्राप्त करें',
    calculateProfit: 'लाभ गणना करें',
    todayAdvisor: 'आज का कृषि सलाहकार',
    tapToSpeak: 'बोलने के लिए टैप करें',
    typeInstead: 'इसके बजाय टाइप करें',
    listen: 'सुनें',
    stop: 'रोकें',
    send: 'भेजें',
  },
  ta: {
    tagline: 'இந்திய விவசாயிகள் சிறந்த முடிவுகள் எடுக்க உதவுதல்.',
    welcome: 'ஸ்மார்ட்ஃபார்ம் AI க்கு வரவேற்கிறோம்',
    chooseLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
    permissions: 'அனுமதிகள்',
    talkToAI: 'ஸ்மார்ட்ஃபார்ம் AI உடன் பேசவும்',
    enterFarmerDetails: 'விவசாயி விவரங்களை உள்ளிடவும்',
    demoMode: 'டெமோ பயன்முறை',
    home: 'முகப்பு',
    market: 'சந்தை',
    talk: 'பேச',
    weather: 'வானிலை',
    more: 'மேலும்',
    back: 'பின்செல்',
    dashboard: 'டாஷ்போர்டு',
    myCrop: 'என் பயிர்',
    cropHealth: 'பயிர் ஆரோக்கியம்',
    marketPrice: 'சந்தை விலை',
    sellCrop: 'பயிர் விற்க',
    safety: 'பாதுகாப்பு',
    profit: 'லாபம்',
    schemes: 'திட்டங்கள்',
    getHelp: 'உதவி பெற',
    soilTest: 'மண் சோதனை',
    settings: 'அமைப்புகள்',
    currentLocation: 'தற்போதைய இடம்',
    changeLocation: 'இடத்தை மாற்று',
    retry: 'மீண்டும் முயற்சி',
    openOfficialSource: 'அதிகாரப்பூர்வ மூலத்தைத் திறக்கவும்',
    loading: 'ஏற்றுகிறது...',
    liveDataUnavailable: 'நேரடி தரவு தற்காலிகமாக கிடைக்கவில்லை.',
    viewPrices: 'விலைகளைப் பார்க்கவும்',
    checkCropHealth: 'பயிர் ஆரோக்கியம் சரிபார்க்கவும்',
    findBuyers: 'சரிபார்க்கப்பட்ட விற்பனை பாதையைக் கண்டுபிடிக்கவும்',
    viewWeather: 'வானிலை பார்க்கவும்',
    viewSchemes: 'திட்டங்கள் பார்க்கவும்',
    findSupport: 'உதவி கண்டுபிடிக்கவும்',
    checkSoil: 'மண் சரிபார்க்கவும்',
    getRecommendation: 'பயிர் பரிந்துரை பெறவும்',
    calculateProfit: 'லாபம் கணக்கிடவும்',
    todayAdvisor: 'இன்றைய விவசாய ஆலோசகர்',
    tapToSpeak: 'பேச தட்டவும்',
    typeInstead: 'அதற்கு பதிலாக தட்டச்சு செய்யவும்',
    listen: 'கேளுங்கள்',
    stop: 'நிறுத்து',
    send: 'அனுப்பு',
  },
  kn: {
    tagline: 'ಭಾರತೀಯ ರೈತರು ಉತ್ತಮ ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುವುದು.',
    welcome: 'ಸ್ಮಾರ್ಟ್ ಫಾರ್ಮ್ AI ಗೆ ಸ್ವಾಗತ',
    chooseLanguage: 'ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    permissions: 'ಅನುಮತಿಗಳು',
    talkToAI: 'ಸ್ಮಾರ್ಟ್ ಫಾರ್ಮ್ AI ಯೊಂದಿಗೆ ಮಾತನಾಡಿ',
    enterFarmerDetails: 'ರೈತರ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ',
    demoMode: 'ಡೆಮೋ ಮೋಡ್',
    home: 'ಮುಖಪುಟ',
    market: 'ಮಾರುಕಟ್ಟೆ',
    talk: 'ಮಾತು',
    weather: 'ಹವಾಮಾನ',
    more: 'ಇನ್ನಷ್ಟು',
    back: 'ಹಿಂದೆ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    myCrop: 'ನನ್ನ ಬೆಳೆ',
    cropHealth: 'ಬೆಳೆ ಆರೋಗ್ಯ',
    marketPrice: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ',
    sellCrop: 'ಬೆಳೆ ಮಾರಾಟ',
    safety: 'ಸುರಕ್ಷತೆ',
    profit: 'ಲಾಭ',
    schemes: 'ಯೋಜನೆಗಳು',
    getHelp: 'ಸಹಾಯ ಪಡೆಯಿರಿ',
    soilTest: 'ಮಣ್ಣು ಪರೀಕ್ಷೆ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    currentLocation: 'ಪ್ರಸ್ತುತ ಸ್ಥಳ',
    changeLocation: 'ಸ್ಥಳ ಬದಲಿಸಿ',
    retry: 'ಮರುಪ್ರಯತ್ನಿಸಿ',
    openOfficialSource: 'ಅಧಿಕೃತ ಮೂಲ ತೆರೆಯಿರಿ',
    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    liveDataUnavailable: 'ನೇರ ಡೇಟಾ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.',
    viewPrices: 'ಬೆಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    checkCropHealth: 'ಬೆಳೆ ಆರೋಗ್ಯ ಪರೀಕ್ಷಿಸಿ',
    findBuyers: 'ಪರಿಶೀಲಿಸಿದ ಮಾರಾಟ ಮಾರ್ಗ ಕಂಡುಹಿಡಿಯಿರಿ',
    viewWeather: 'ಹವಾಮಾನ ವೀಕ್ಷಿಸಿ',
    viewSchemes: 'ಯೋಜನೆಗಳು ವೀಕ್ಷಿಸಿ',
    findSupport: 'ಸಹಾಯ ಕಂಡುಹಿಡಿಯಿರಿ',
    checkSoil: 'ಮಣ್ಣು ಪರೀಕ್ಷಿಸಿ',
    getRecommendation: 'ಬೆಳೆ ಶಿಫಾರಸು ಪಡೆಯಿರಿ',
    calculateProfit: 'ಲಾಭ ಲೆಕ್ಕಾಚಾರ',
    todayAdvisor: 'ಇಂದಿನ ಕೃಷಿ ಸಲಹೆಗಾರ',
    tapToSpeak: 'ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    typeInstead: 'ಬದಲಿಗೆ ಟೈಪ್ ಮಾಡಿ',
    listen: 'ಕೇಳಿ',
    stop: 'ನಿಲ್ಲಿಸಿ',
    send: 'ಕಳುಹಿಸಿ',
  },
  ml: {
    tagline: 'ഇന്ത്യൻ കർഷകർ മികച്ച തീരുമാനങ്ങൾ എടുക്കാൻ സഹായിക്കുന്നു.',
    welcome: 'സ്മാർട്ട് ഫാം AI-ലേക്ക് സ്വാഗതം',
    chooseLanguage: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
    permissions: 'അനുമതികൾ',
    talkToAI: 'സ്മാർട്ട് ഫാം AI-യുമായി സംസാരിക്കുക',
    enterFarmerDetails: 'കർഷക വിശദാംശങ്ങൾ നൽകുക',
    demoMode: 'ഡെമോ മോഡ്',
    home: 'ഹോം',
    market: 'മാർക്കറ്റ്',
    talk: 'സംസാരം',
    weather: 'കാലാവസ്ഥ',
    more: 'കൂടുതൽ',
    back: 'തിരികെ',
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    myCrop: 'എന്റെ വിള',
    cropHealth: 'വിള ആരോഗ്യം',
    marketPrice: 'മാർക്കറ്റ് വില',
    sellCrop: 'വിള വിൽക്കുക',
    safety: 'സുരക്ഷ',
    profit: 'ലാഭം',
    schemes: 'പദ്ധതികൾ',
    getHelp: 'സഹായം നേടുക',
    soilTest: 'മണ്ണ് പരിശോധന',
    settings: 'ക്രമീകരണങ്ങൾ',
    currentLocation: 'നിലവിലെ സ്ഥാനം',
    changeLocation: 'സ്ഥാനം മാറ്റുക',
    retry: 'വീണ്ടും ശ്രമിക്കുക',
    openOfficialSource: 'ഔദ്യോഗിക ഉറവിടം തുറക്കുക',
    loading: 'ലോഡുചെയ്യുന്നു...',
    liveDataUnavailable: 'തത്സമയ ഡാറ്റ താൽക്കാലികമായി ലഭ്യമല്ല.',
    viewPrices: 'വിലകൾ കാണുക',
    checkCropHealth: 'വിള ആരോഗ്യം പരിശോധിക്കുക',
    findBuyers: 'പരിശോധിച്ച വിൽപ്പൻ പാത കണ്ടെത്തുക',
    viewWeather: 'കാലാവസ്ഥ കാണുക',
    viewSchemes: 'പദ്ധതികൾ കാണുക',
    findSupport: 'സഹായം കണ്ടെത്തുക',
    checkSoil: 'മണ്ണ് പരിശോധിക്കുക',
    getRecommendation: 'വിള ശുപാർശ നേടുക',
    calculateProfit: 'ലാഭം കണക്കാക്കുക',
    todayAdvisor: 'ഇന്നത്തെ കാർഷിക ഉപദേശകൻ',
    tapToSpeak: 'സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക',
    typeInstead: 'പകരം ടൈപ്പ് ചെയ്യുക',
    listen: 'കേൾക്കുക',
    stop: 'നിർത്തുക',
    send: 'അയയ്ക്കുക',
  },
  mr: {
    tagline: 'भारतीय शेतकऱ्यांना चांगले निर्णय घेण्यास मदत करणे.',
    welcome: 'स्मार्टफार्म AI मध्ये आपले स्वागत आहे',
    chooseLanguage: 'तुमची भाषा निवडा',
    permissions: 'परवानग्या',
    talkToAI: 'स्मार्टफार्म AI सोबत बोला',
    enterFarmerDetails: 'शेतकरी तपशील नोंदवा',
    demoMode: 'डेमो मोड',
    home: 'होम',
    market: 'बाजार',
    talk: 'बोला',
    weather: 'हवामान',
    more: 'अधिक',
    back: 'मागे',
    dashboard: 'डॅशबोर्ड',
    myCrop: 'माझे पीक',
    cropHealth: 'पीक आरोग्य',
    marketPrice: 'बाजार भाव',
    sellCrop: 'पीक विका',
    safety: 'सुरक्षा',
    profit: 'नफा',
    schemes: 'योजना',
    getHelp: 'मदत मिळवा',
    soilTest: 'माती चाचणी',
    settings: 'सेटिंग्ज',
    currentLocation: 'सध्याचे स्थान',
    changeLocation: 'स्थान बदला',
    retry: 'पुन्हा प्रयत्न करा',
    openOfficialSource: 'अधिकृत स्रोत उघडा',
    loading: 'लोड होत आहे...',
    liveDataUnavailable: 'थेट डेटा तात्पुरता अनुपलब्ध आहे.',
    viewPrices: 'भाव पहा',
    checkCropHealth: 'पीक आरोग्य तपासा',
    findBuyers: 'पडताळणी केलेला विक्री मार्ग शोधा',
    viewWeather: 'हवामान पहा',
    viewSchemes: 'योजना पहा',
    findSupport: 'मदत शोधा',
    checkSoil: 'माती तपासा',
    getRecommendation: 'पीक शिफारस मिळवा',
    calculateProfit: 'नफा मोजा',
    todayAdvisor: 'आजचा शेती सल्लागार',
    tapToSpeak: 'बोलण्यासाठी टॅप करा',
    typeInstead: 'त्याऐवजी टाईप करा',
    listen: 'ऐका',
    stop: 'थांबा',
    send: 'पाठवा',
  },
};

interface AppContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  location: LocationInfo;
  setLocation: (loc: LocationInfo) => void;
  detectLocation: () => Promise<void>;
  isDetectingLocation: boolean;
  locationError: string | null;
  farmerDetails: FarmerDetails | null;
  setFarmerDetails: (details: FarmerDetails | null) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  hasOnboarded: boolean;
  setHasOnboarded: (done: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const LANGUAGE_KEY = 'smartfarm_language';
const FARMER_KEY = 'smartfarm_farmer';
const ONBOARDED_KEY = 'smartfarm_onboarded';
const DEMO_KEY = 'smartfarm_demo_mode';

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as LanguageCode | null;
    return saved && LANGUAGES.some(l => l.code === saved) ? saved : 'en';
  });

  const [location, setLocationState] = useState<LocationInfo>(() => loadLocation() || defaultLocation());
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [farmerDetails, setFarmerDetailsState] = useState<FarmerDetails | null>(() => {
    const raw = localStorage.getItem(FARMER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as FarmerDetails; } catch { return null; }
  });

  const [demoMode, setDemoModeState] = useState<boolean>(() => localStorage.getItem(DEMO_KEY) === 'true');
  const [hasOnboarded, setHasOnboardedState] = useState<boolean>(() => localStorage.getItem(ONBOARDED_KEY) === 'true');

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  }, [language]);

  const setLocation = useCallback((loc: LocationInfo) => {
    setLocationState(loc);
    saveLocation(loc);
  }, []);

  const detectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    try {
      const gps = await getGPSLocation();
      if (gps) {
        const geocoded = await reverseGeocode(gps.latitude, gps.longitude);
        const newLoc: LocationInfo = {
          latitude: gps.latitude,
          longitude: gps.longitude,
          country: geocoded.country || 'India',
          state: geocoded.state || '',
          district: geocoded.district || '',
          city: geocoded.city || '',
          village: geocoded.village || null,
          pincode: geocoded.pincode || null,
          source: 'gps',
        };
        setLocation(newLoc);
      } else {
        setLocationError('Could not detect your location. Please allow location access or select manually.');
      }
    } catch {
      setLocationError('Could not detect your location. Please try again or select manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, [setLocation]);

  const setFarmerDetails = useCallback((details: FarmerDetails | null) => {
    setFarmerDetailsState(details);
    if (details) {
      localStorage.setItem(FARMER_KEY, JSON.stringify(details));
    } else {
      localStorage.removeItem(FARMER_KEY);
    }
  }, []);

  const setDemoMode = useCallback((enabled: boolean) => {
    setDemoModeState(enabled);
    localStorage.setItem(DEMO_KEY, String(enabled));
  }, []);

  const setHasOnboarded = useCallback((done: boolean) => {
    setHasOnboardedState(done);
    localStorage.setItem(ONBOARDED_KEY, String(done));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <AppContext.Provider value={{
      language, setLanguage, t,
      location, setLocation, detectLocation, isDetectingLocation, locationError,
      farmerDetails, setFarmerDetails,
      demoMode, setDemoMode,
      hasOnboarded, setHasOnboarded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
