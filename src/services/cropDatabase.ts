export interface CropInfo {
  name: string;
  category: 'Cereal' | 'Pulse' | 'Oilseed' | 'Cash Crop' | 'Vegetable' | 'Fruit' | 'Spice' | 'Other';
  seasons: string[];
  waterRequirement: 'Low' | 'Medium' | 'High';
  growingPeriodDays: string;
  commonDiseases: string[];
  commonPests: string[];
}

export const CROP_DATABASE: CropInfo[] = [
  { name: 'Tobacco', category: 'Cash Crop', seasons: ['Rabi', 'Kharif'], waterRequirement: 'Medium', growingPeriodDays: '90-120', commonDiseases: ['Mosaic Virus', 'Leaf Spot', 'Blight', 'Root Rot'], commonPests: ['Aphid', 'Caterpillar', 'Whitefly', 'Thrips'] },
  { name: 'Rice', category: 'Cereal', seasons: ['Kharif', 'Rabi'], waterRequirement: 'High', growingPeriodDays: '110-140', commonDiseases: ['Blast', 'Bacterial Blight', 'Sheath Blight', 'Tungro Virus'], commonPests: ['Stem Borer', 'Leaf Folder', 'Planthopper'] },
  { name: 'Wheat', category: 'Cereal', seasons: ['Rabi'], waterRequirement: 'Medium', growingPeriodDays: '110-130', commonDiseases: ['Rust', 'Smut', 'Blight', 'Powdery Mildew'], commonPests: ['Aphid', 'Armyworm', 'Termites'] },
  { name: 'Maize', category: 'Cereal', seasons: ['Kharif', 'Rabi'], waterRequirement: 'Medium', growingPeriodDays: '90-120', commonDiseases: ['Blight', 'Stalk Rot', 'Leaf Spot', 'Downy Mildew'], commonPests: ['Stem Borer', 'Fall Armyworm', 'Aphid'] },
  { name: 'Cotton', category: 'Cash Crop', seasons: ['Kharif'], waterRequirement: 'Medium', growingPeriodDays: '150-180', commonDiseases: ['Boll Rot', 'Wilt', 'Leaf Spot', 'Leaf Curl Virus'], commonPests: ['Bollworm', 'Aphid', 'Whitefly', 'Thrips'] },
  { name: 'Chilli', category: 'Vegetable', seasons: ['Kharif', 'Rabi'], waterRequirement: 'Medium', growingPeriodDays: '120-150', commonDiseases: ['Powdery Mildew', 'Leaf Spot', 'Fruit Rot', 'Mosaic Virus'], commonPests: ['Thrips', 'Aphid', 'Mite', 'Fruit Borer'] },
  { name: 'Tomato', category: 'Vegetable', seasons: ['Kharif', 'Rabi', 'Zaid'], waterRequirement: 'Medium', growingPeriodDays: '90-120', commonDiseases: ['Early Blight', 'Late Blight', 'Leaf Curl Virus', 'Wilt'], commonPests: ['Fruit Borer', 'Whitefly', 'Aphid', 'Mite'] },
  { name: 'Potato', category: 'Vegetable', seasons: ['Rabi'], waterRequirement: 'Medium', growingPeriodDays: '90-120', commonDiseases: ['Late Blight', 'Early Blight', 'Black Scurf', 'Wilt'], commonPests: ['Aphid', 'Whitefly', 'Cutworm', 'Tuber Moth'] },
  { name: 'Onion', category: 'Vegetable', seasons: ['Rabi', 'Kharif'], waterRequirement: 'Medium', growingPeriodDays: '110-130', commonDiseases: ['Purple Blotch', 'Blast', 'Basal Rot'], commonPests: ['Thrips', 'Bulb Fly', 'Cutworm'] },
  { name: 'Groundnut', category: 'Oilseed', seasons: ['Kharif', 'Rabi'], waterRequirement: 'Low', growingPeriodDays: '100-130', commonDiseases: ['Tikka Leaf Spot', 'Rust', 'Aflatoxin'], commonPests: ['Aphid', 'Leaf Miner', 'Pod Borer'] },
  { name: 'Soybean', category: 'Oilseed', seasons: ['Kharif'], waterRequirement: 'Medium', growingPeriodDays: '100-120', commonDiseases: ['Rust', 'Yellow Mosaic Virus', 'Anthracnose'], commonPests: ['Semilooper', 'Stem Fly', 'Girdle Beetle'] },
  { name: 'Sugarcane', category: 'Cash Crop', seasons: ['Kharif', 'Rabi'], waterRequirement: 'High', growingPeriodDays: '300-360', commonDiseases: ['Red Rot', 'Wilt', 'Smut', 'Blight'], commonPests: ['Borer', 'Pyrilla', 'Mealybug'] },
  { name: 'Turmeric', category: 'Spice', seasons: ['Kharif'], waterRequirement: 'Medium', growingPeriodDays: '240-270', commonDiseases: ['Leaf Spot', 'Rhizome Rot'], commonPests: ['Rhizome Fly', 'Scale Insect'] },
  { name: 'Pigeon Pea', category: 'Pulse', seasons: ['Kharif'], waterRequirement: 'Low', growingPeriodDays: '150-180', commonDiseases: ['Wilt', 'Sterility Mosaic', 'Blight'], commonPests: ['Pod Borer', 'Pod Fly', 'Maruka'] },
  { name: 'Black Gram', category: 'Pulse', seasons: ['Kharif', 'Rabi'], waterRequirement: 'Low', growingPeriodDays: '70-90', commonDiseases: ['Yellow Mosaic Virus', 'Wilt', 'Leaf Spot'], commonPests: ['Aphid', 'Pod Borer', 'Whitefly'] },
  { name: 'Green Gram', category: 'Pulse', seasons: ['Kharif', 'Rabi', 'Zaid'], waterRequirement: 'Low', growingPeriodDays: '60-75', commonDiseases: ['Yellow Mosaic Virus', 'Leaf Spot', 'Powdery Mildew'], commonPests: ['Aphid', 'Whitefly', 'Pod Borer'] },
  { name: 'Bengal Gram', category: 'Pulse', seasons: ['Rabi'], waterRequirement: 'Low', growingPeriodDays: '100-120', commonDiseases: ['Wilt', 'Ascochyta Blight', 'Rust'], commonPests: ['Pod Borer', 'Cutworm', 'Aphid'] },
  { name: 'Lentil', category: 'Pulse', seasons: ['Rabi'], waterRequirement: 'Low', growingPeriodDays: '100-110', commonDiseases: ['Wilt', 'Rust', 'Stemphylium Blight'], commonPests: ['Aphid', 'Pod Borer'] },
  { name: 'Mustard', category: 'Oilseed', seasons: ['Rabi'], waterRequirement: 'Low', growingPeriodDays: '110-130', commonDiseases: ['White Rust', 'Alternaria Blight', 'Powdery Mildew'], commonPests: ['Aphid', 'Painted Bug', 'Leaf Miner'] },
  { name: 'Sunflower', category: 'Oilseed', seasons: ['Kharif', 'Rabi', 'Zaid'], waterRequirement: 'Low', growingPeriodDays: '90-110', commonDiseases: ['Rust', 'Alternaria Leaf Spot', 'Downy Mildew'], commonPests: ['Aphid', 'Capitulum Borer', 'Leaf Eater'] },
  { name: 'Sesame', category: 'Oilseed', seasons: ['Kharif', 'Zaid'], waterRequirement: 'Low', growingPeriodDays: '80-100', commonDiseases: ['Leaf Spot', 'Wilt', 'Stem Rot'], commonPests: ['Aphid', 'Gall Midge', 'Leaf Roller'] },
  { name: 'Jowar', category: 'Cereal', seasons: ['Kharif', 'Rabi'], waterRequirement: 'Low', growingPeriodDays: '100-120', commonDiseases: ['Grain Mold', 'Leaf Blight', 'Rust'], commonPests: ['Shoot Fly', 'Stem Borer', 'Aphid'] },
  { name: 'Bajra', category: 'Cereal', seasons: ['Kharif'], waterRequirement: 'Low', growingPeriodDays: '80-90', commonDiseases: ['Downy Mildew', 'Ergot', 'Smut'], commonPests: ['Shoot Fly', 'Stem Borer'] },
  { name: 'Ragi', category: 'Cereal', seasons: ['Kharif'], waterRequirement: 'Low', growingPeriodDays: '110-130', commonDiseases: ['Blast', 'Leaf Spot'], commonPests: ['Stem Borer', 'Aphid'] },
  { name: 'Banana', category: 'Fruit', seasons: ['Kharif', 'Rabi'], waterRequirement: 'High', growingPeriodDays: '300-360', commonDiseases: ['Panama Wilt', 'Sigatoka Leaf Spot', 'Bunchy Top Virus'], commonPests: ['Rhizome Weevil', 'Aphid', 'Thrips'] },
  { name: 'Mango', category: 'Fruit', seasons: ['Kharif'], waterRequirement: 'Low', growingPeriodDays: 'Perennial', commonDiseases: ['Anthracnose', 'Powdery Mildew', 'Dieback'], commonPests: ['Mango Hopper', 'Fruit Fly', 'Stem Borer'] },
  { name: 'Papaya', category: 'Fruit', seasons: ['Kharif', 'Rabi'], waterRequirement: 'Medium', growingPeriodDays: 'Perennial', commonDiseases: ['Ring Spot Virus', 'Foot Rot', 'Leaf Curl'], commonPests: ['Aphid', 'Mealybug', 'Fruit Fly'] },
  { name: 'Watermelon', category: 'Fruit', seasons: ['Zaid', 'Kharif'], waterRequirement: 'Medium', growingPeriodDays: '80-100', commonDiseases: ['Fusarium Wilt', 'Leaf Spot', 'Mosaic Virus'], commonPests: ['Aphid', 'Thrips', 'Fruit Fly'] },
  { name: 'Other Crop', category: 'Other', seasons: ['Kharif', 'Rabi', 'Zaid'], waterRequirement: 'Medium', growingPeriodDays: 'Varies', commonDiseases: [], commonPests: [] },
];

export const CROP_NAMES: string[] = CROP_DATABASE.map(c => c.name);

export function getCropInfo(name: string): CropInfo | undefined {
  return CROP_DATABASE.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function searchCrops(query: string): CropInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return CROP_DATABASE;
  return CROP_DATABASE.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q)
  );
}

export function getCropsByCategory(category: string): CropInfo[] {
  return CROP_DATABASE.filter(c => c.category === category);
}

export const CROP_CATEGORIES = ['Cereal', 'Pulse', 'Oilseed', 'Cash Crop', 'Vegetable', 'Fruit', 'Spice', 'Other'] as const;
