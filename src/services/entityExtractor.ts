export interface ExtractedEntities {
  crop: string | null;
  variety: string | null;
  disease: string | null;
  pest: string | null;
  location: string | null;
  district: string | null;
  state: string | null;
  soilType: string | null;
  soilPh: string | null;
  cropStage: string | null;
  market: string | null;
  quantity: string | null;
  date: string | null;
  weatherCondition: string | null;
  missingEntities: string[];
}

const CROP_NAMES: Record<string, string> = {
  rice: 'Rice', paddy: 'Rice', dhan: 'Rice', వరి: 'Rice', चावल: 'Rice', அரிசி: 'Rice', ಅಕ್ಕಿ: 'Rice', നെല്ല്: 'Rice',
  wheat: 'Wheat', గోధుమ: 'Wheat', गेहूं: 'Wheat', கோதுமை: 'Wheat', ಗೋಧು: 'Wheat', ഗോതമ്പ്: 'Wheat',
  cotton: 'Cotton', పత్తి: 'Cotton', कपास: 'Cotton', பருத்தி: 'Cotton', ಹತ್ತಿ: 'Cotton', പരുത്തി: 'Cotton',
  maize: 'Maize', corn: 'Maize', మొక్కజొన్న: 'Maize', मक्का: 'Maize', சோளம்: 'Maize', ಮೆಕ್ಕೆ: 'Maize', ചോളം: 'Maize',
  soybean: 'Soybean', సోయాబీన్: 'Soybean', सोयाबीन: 'Soybean', சோயாபீன்: 'Soybean', ಸೋಯಾಬೀನ್: 'Soybean', സോയാബീൻ: 'Soybean',
  groundnut: 'Groundnut', peanut: 'Groundnut', వేరుశనగ: 'Groundnut', मूंगफली: 'Groundnut', நிலக்கடலை: 'Groundnut', ಕಡಲೆಕಾಯಿ: 'Groundnut', നിലക്കടല: 'Groundnut',
  onion: 'Onion', ఉల్లిపాయ: 'Onion', प्याज: 'Onion', வெங்காயம்: 'Onion', ಈರುಳ್ಳಿ: 'Onion', സവാള: 'Onion',
  tomato: 'Tomato', టమాట: 'Tomato', टमाटर: 'Tomato', தக்காளி: 'Tomato', ಟೊಮ್ಯಾಟೊ: 'Tomato', തക്കാളി: 'Tomato',
  potato: 'Potato', ఆలుగడ్డ: 'Potato', आलू: 'Potato', உருளைக்கிழங்கு: 'Potato', ಆಲೂಗಡ್ಡೆ: 'Potato', ഉരുളക്കിഴങ്ങ്: 'Potato',
  chilli: 'Chilli', chili: 'Chilli', మిరప: 'Chilli', मिर्च: 'Chilli', மிளகாய்: 'Chilli', ಮೆಣಸಿನಕಾಯಿ: 'Chilli', മുളക്: 'Chilli',
  turmeric: 'Turmeric', పసుపు: 'Turmeric', हल्दी: 'Turmeric', மஞ்சள்: 'Turmeric', ಅರಿಶಿನ: 'Turmeric', മഞ്ഞൾ: 'Turmeric',
  sugarcane: 'Sugarcane', చెరకు: 'Sugarcane', गन्ना: 'Sugarcane', கரும்பு: 'Sugarcane', ಕಬ್ಬು: 'Sugarcane', കരുമ്പ്: 'Sugarcane',
  banana: 'Banana', అరటి: 'Banana', केला: 'Banana', வாழை: 'Banana', ಬಾಳೆ: 'Banana', വാഴ: 'Banana',
  mango: 'Mango', మామిడి: 'Mango', आम: 'Mango', மாம்பழம்: 'Mango', ಮಾವು: 'Mango', മാങ്ങ: 'Mango',
  mustard: 'Mustard', ఆవాల: 'Mustard', सरसों: 'Mustard', கடுகு: 'Mustard', ಸಾಸಿವೆ: 'Mustard', കടുക്: 'Mustard',
  pigeon: 'Pigeon Pea', toor: 'Pigeon Pea', tur: 'Pigeon Pea', arhar: 'Pigeon Pea', కంది: 'Pigeon Pea', अरहर: 'Pigeon Pea', துவரை: 'Pigeon Pea', ತೊಗರಿ: 'Pigeon Pea', തുവര: 'Pigeon Pea',
  gram: 'Bengal Gram', chana: 'Bengal Gram', శనగ: 'Bengal Gram', चना: 'Bengal Gram', கடலை: 'Bengal Gram', ಕಡಲೆ: 'Bengal Gram', കടല: 'Bengal Gram',
  black: 'Black Gram', urad: 'Black Gram', మినుము: 'Black Gram', उड़द: 'Black Gram', உளுந்து: 'Black Gram', ಉದ್ದು: 'Black Gram', ഉഴുന്ന്: 'Black Gram',
  green: 'Green Gram', moong: 'Green Gram', పెసర: 'Green Gram', मूंग: 'Green Gram', பயறு: 'Green Gram', ಹೆಸರು: 'Green Gram', പയർ: 'Green Gram',
  jowar: 'Jowar', sorghum: 'Jowar', జొన్న: 'Jowar', ज्वार: 'Jowar', ಜೋಳ: 'Jowar',
  bajra: 'Bajra', pearl: 'Bajra', సజ్జ: 'Bajra', बाजरा: 'Bajra', கம்பு: 'Bajra', ಸಜ್ಜೆ: 'Bajra', കമ്പ്: 'Bajra',
  ragi: 'Ragi', finger: 'Ragi', రాగి: 'Ragi', रागी: 'Ragi', கேழ்வரகு: 'Ragi', ರಾಗಿ: 'Ragi', രാഗി: 'Ragi',
  coconut: 'Coconut', కొబ్బరి: 'Coconut', नारियल: 'Coconut', தேங்காய்: 'Coconut', ತೆಂಗು: 'Coconut', തെങ്ങ്: 'Coconut',
  coriander: 'Coriander', ధనియాల: 'Coriander', धनिया: 'Coriander', கொத்தமல்லி: 'Coriander', ಕೊತ್ತಂಬರಿ: 'Coriander', മല്ലി: 'Coriander',
  cumin: 'Cumin', jeera: 'Cumin', జీలకర్ర: 'Cumin', जीरा: 'Cumin', சீரகம்: 'Cumin', ಜೀರಿಗೆ: 'Cumin', ജീരകം: 'Cumin',
  ginger: 'Ginger', అల్లం: 'Ginger', अदरक: 'Ginger', இஞ்சி: 'Ginger', ಶುಂಠಿ: 'Ginger', ഇഞ്ചി: 'Ginger',
  garlic: 'Garlic', వెల్లుల్లి: 'Garlic', लहसुन: 'Garlic', பூண்டு: 'Garlic', ಬೆಳ್ಳುಳ್ಳಿ: 'Garlic', വെളുത്തുള്ളി: 'Garlic',
};

const DISEASE_NAMES: Record<string, string> = {
  'yellow leaf': 'Yellow Leaf Disease',
  'yellow leaves': 'Yellow Leaf Disease',
  'leaf spot': 'Leaf Spot',
  'leaf spots': 'Leaf Spot',
  'powdery mildew': 'Powdery Mildew',
  'downy mildew': 'Downy Mildew',
  'blight': 'Blight',
  'rust': 'Rust',
  'wilt': 'Wilt',
  'rot': 'Rot',
  'root rot': 'Root Rot',
  'leaf curl': 'Leaf Curl',
  'mold': 'Mold',
  'fungus': 'Fungal Infection',
  'పసుపు ఆకులు': 'Yellow Leaf Disease',
  'మచ్చలు': 'Leaf Spot',
  'తెగులు': 'Fungal Infection',
  'కుళ్ళు': 'Rot',
  'पीला पत्ता': 'Yellow Leaf Disease',
  'धब्बे': 'Leaf Spot',
  'फंगस': 'Fungal Infection',
  'सड़ना': 'Rot',
  'மஞ்சள் இலை': 'Yellow Leaf Disease',
  'புள்ளிகள்': 'Leaf Spot',
  'அழுகல்': 'Rot',
  'ಹಳದಿ ಎಲೆ': 'Yellow Leaf Disease',
  'ಕಲೆಗಳು': 'Leaf Spot',
  'ಕೊಳೆತ': 'Rot',
  'മഞ്ഞ ഇല': 'Yellow Leaf Disease',
  'പാടുകൾ': 'Leaf Spot',
  'അഴുകൽ': 'Rot',
};

const PEST_NAMES: Record<string, string> = {
  'aphid': 'Aphid', 'aphids': 'Aphid',
  'thrips': 'Thrips',
  'mite': 'Mite', 'mites': 'Mite',
  'borer': 'Borer', 'stem borer': 'Stem Borer',
  'caterpillar': 'Caterpillar', 'caterpillars': 'Caterpillar',
  'whitefly': 'Whitefly', 'white fly': 'Whitefly',
  'mealybug': 'Mealybug', 'mealy bug': 'Mealybug',
  'hopper': 'Hopper', 'leafhopper': 'Leaf Hopper',
  'పురుగు': 'Pest Infestation',
  'కీటక': 'Pest Infestation',
  'कीड़ा': 'Pest Infestation',
  'कीट': 'Pest Infestation',
  'सुंडी': 'Caterpillar',
  'பூச்சி': 'Pest Infestation',
  'புழு': 'Caterpillar',
  'ಕೀಟ': 'Pest Infestation',
  'ಹುಳು': 'Caterpillar',
  'പ്രാണി': 'Pest Infestation',
  'പുഴു': 'Caterpillar',
};

const INDIAN_STATES = [
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand',
  'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur',
  'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
  'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
  'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi',
  'jammu & kashmir', 'jammu and kashmir', 'ladakh',
];

const INDIAN_DISTRICTS: Record<string, string> = {
  'nizamabad': 'Nizamabad', 'nizamabaad': 'Nizamabad',
  'warangal': 'Warangal', 'karimnagar': 'Karimnagar',
  'adilabad': 'Adilabad', 'khammam': 'Khammam',
  'nagpur': 'Nagpur', 'pune': 'Pune', 'aurangabad': 'Aurangabad',
  'nashik': 'Nashik', 'jalgaon': 'Jalgaon',
  'belgaum': 'Belgaum', 'gulbarga': 'Gulbarga', 'dharwad': 'Dharwad',
  'coimbatore': 'Coimbatore', 'madurai': 'Madurai', 'salem': 'Salem',
  'tiruchirappalli': 'Tiruchirappalli', 'trichy': 'Tiruchirappalli',
  'krishna': 'Krishna', 'guntur': 'Guntur', 'visakhapatnam': 'Visakhapatnam',
  'east godavari': 'East Godavari', 'west godavari': 'West Godavari',
  'lucknow': 'Lucknow', 'kanpur': 'Kanpur', 'agra': 'Agra',
  'varanasi': 'Varanasi', 'meerut': 'Meerut',
  'indore': 'Indore', 'bhopal': 'Bhopal', 'jabalpur': 'Jabalpur',
  'ludhiana': 'Ludhiana', 'amritsar': 'Amritsar',
  'hisar': 'Hisar', 'karnal': 'Karnal',
  'rajkot': 'Rajkot', 'surat': 'Surat', 'vadodara': 'Vadodara',
  'jaipur': 'Jaipur', 'jodhpur': 'Jodhpur', 'kota': 'Kota',
  'bhubaneswar': 'Bhubaneswar', 'cuttack': 'Cuttack',
  'raipur': 'Raipur', 'bilaspur': 'Bilaspur',
  'ranchi': 'Ranchi', 'jamshedpur': 'Jamshedpur',
  'dehradun': 'Dehradun', 'haridwar': 'Haridwar',
  'నిజామాబాద్': 'Nizamabad', 'వరంగల్': 'Warangal', 'కరీంనగర్': 'Karimnagar',
  'ఖమ్మం': 'Khammam', 'గుంటూరు': 'Guntur', 'కృష్ణా': 'Krishna',
  'निजामाबाद': 'Nizamabad', 'वारंगल': 'Warangal', 'पुणे': 'Pune',
};

const SOIL_TYPES: Record<string, string> = {
  'black soil': 'Black Soil', 'red soil': 'Red Soil', 'alluvial soil': 'Alluvial Soil',
  'laterite soil': 'Laterite Soil', 'sandy soil': 'Sandy Soil', 'clay soil': 'Clay Soil',
  'loamy soil': 'Loamy Soil', 'saline soil': 'Saline Soil',
  'నల్ల మట్టి': 'Black Soil', 'ఎర్ర మట్టి': 'Red Soil',
  'काली मिट्टी': 'Black Soil', 'लाल मिट्टी': 'Red Soil',
  'கருப்பு மண்': 'Black Soil', 'செம்மண்': 'Red Soil',
};

const CROP_STAGES: Record<string, string> = {
  'seedling': 'Seedling', 'vegetative': 'Vegetative', 'flowering': 'Flowering',
  'fruiting': 'Fruiting', 'maturity': 'Maturity', 'harvest': 'Harvest Ready',
  'germination': 'Germination', 'tillering': 'Tillering',
};

const WEATHER_CONDITIONS: Record<string, string> = {
  'rain': 'Rain', 'heavy rain': 'Heavy Rain', 'drought': 'Drought',
  'frost': 'Frost', 'heatwave': 'Heatwave', 'storm': 'Storm',
  'cyclone': 'Cyclone', 'flood': 'Flood',
  'వర్షం': 'Rain', 'తుఫాను': 'Cyclone',
  'बारिश': 'Rain', 'तूफान': 'Cyclone', 'सूखा': 'Drought',
  'மழை': 'Rain', 'புயல்': 'Cyclone',
};

export function extractEntities(query: string): ExtractedEntities {
  const lower = query.toLowerCase().trim();

  let crop: string | null = null;
  let variety: string | null = null;
  let disease: string | null = null;
  let pest: string | null = null;
  let location: string | null = null;
  let district: string | null = null;
  let state: string | null = null;
  let soilType: string | null = null;
  let soilPh: string | null = null;
  let cropStage: string | null = null;
  let market: string | null = null;
  let quantity: string | null = null;
  let date: string | null = null;
  let weatherCondition: string | null = null;

  // Extract crop
  for (const [keyword, value] of Object.entries(CROP_NAMES)) {
    if (lower.includes(keyword)) {
      crop = value;
      break;
    }
  }

  // Extract disease
  for (const [keyword, value] of Object.entries(DISEASE_NAMES)) {
    if (lower.includes(keyword)) {
      disease = value;
      break;
    }
  }

  // Extract pest
  for (const [keyword, value] of Object.entries(PEST_NAMES)) {
    if (lower.includes(keyword)) {
      pest = value;
      break;
    }
  }

  // Extract state
  for (const s of INDIAN_STATES) {
    if (lower.includes(s)) {
      state = s.replace(/\b\w/g, c => c.toUpperCase());
      break;
    }
  }

  // Extract district
  for (const [keyword, value] of Object.entries(INDIAN_DISTRICTS)) {
    if (lower.includes(keyword)) {
      district = value;
      if (!location) location = value;
      break;
    }
  }

  // Extract soil type
  for (const [keyword, value] of Object.entries(SOIL_TYPES)) {
    if (lower.includes(keyword)) {
      soilType = value;
      break;
    }
  }

  // Extract soil pH (pattern: "ph 6.5", "ph is 7", "ph level 5.5")
  const phMatch = lower.match(/ph\s*(?:is|level|value)?\s*[:=]?\s*(\d+\.?\d*)/);
  if (phMatch) {
    soilPh = phMatch[1];
  }

  // Extract crop stage
  for (const [keyword, value] of Object.entries(CROP_STAGES)) {
    if (lower.includes(keyword)) {
      cropStage = value;
      break;
    }
  }

  // Extract weather condition
  for (const [keyword, value] of Object.entries(WEATHER_CONDITIONS)) {
    if (lower.includes(keyword)) {
      weatherCondition = value;
      break;
    }
  }

  // Extract quantity (pattern: "50 kg", "100 quintal", "5 ton")
  const qtyMatch = lower.match(/(\d+)\s*(kg|quintal|ton|tonne|bag|bags|quintals|kgs|tons)/);
  if (qtyMatch) {
    quantity = `${qtyMatch[1]} ${qtyMatch[2]}`;
  }

  // Extract date (pattern: "today", "tomorrow", "yesterday", or date-like)
  if (lower.includes('today')) date = 'Today';
  else if (lower.includes('tomorrow')) date = 'Tomorrow';
  else if (lower.includes('yesterday')) date = 'Yesterday';

  // Determine missing entities based on what was found
  const missingEntities: string[] = [];
  if (!crop) missingEntities.push('crop');
  if (!location && !district && !state) missingEntities.push('location');

  return {
    crop,
    variety,
    disease,
    pest,
    location,
    district,
    state,
    soilType,
    soilPh,
    cropStage,
    market,
    quantity,
    date,
    weatherCondition,
    missingEntities,
  };
}
