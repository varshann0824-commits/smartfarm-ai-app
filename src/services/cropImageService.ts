/**
 * Data-driven crop → photographic image mapping.
 *
 * Each crop (canonical AGMARKNET name or alias) resolves to a dedicated,
 * realistic agricultural photo stored under public/assets/crops/.  Crops
 * without a dedicated photo fall back to the closest existing cinematic
 * asset so the UI always shows an appropriate, non-generic image.
 */

const CROPS_BASE = `${import.meta.env.BASE_URL}assets/crops`;
const CINEMATIC_BASE = `${import.meta.env.BASE_URL}assets/cinematic`;

export interface CropImage {
  src: string;
  alt: string;
}

/** Map of normalised crop name → image metadata (crop-specific photos). */
const CROP_IMAGE_MAP: Record<string, { file: string; alt: string }> = {
  rice:       { file: 'rice.jpg',       alt: 'Paddy / rice field' },
  paddy:      { file: 'rice.jpg',       alt: 'Paddy / rice field' },
  wheat:      { file: 'wheat.jpg',      alt: 'Golden wheat field' },
  maize:      { file: 'maize.jpg',      alt: 'Maize / corn field' },
  corn:       { file: 'maize.jpg',      alt: 'Maize / corn field' },
  cotton:     { file: 'cotton.jpg',     alt: 'Cotton crop' },
  'cotton seed': { file: 'cotton.jpg',  alt: 'Cotton crop' },
  soyabean:   { file: 'soybean.jpg',    alt: 'Soybean field' },
  soybean:    { file: 'soybean.jpg',    alt: 'Soybean field' },
  groundnut:  { file: 'groundnut.jpg',  alt: 'Groundnut / peanut field' },
  peanut:     { file: 'groundnut.jpg',  alt: 'Groundnut / peanut field' },
  // Crops without a dedicated photo (mustard, sunflower, sesame, jute,
  // pulses, millets, spices, plantation crops) are resolved by
  // CINEMATIC_CROP_MAP below or by the deterministic cinematic fallback —
  // never by a crops/ filename that does not exist on disk.
  tomato:     { file: 'tomato.jpg',     alt: 'Tomato on vine' },
  onion:      { file: 'onion.jpg',      alt: 'Onion field harvest' },
  potato:     { file: 'potato.jpg',     alt: 'Potato in field' },
  'dry chillies': { file: 'chilli.jpg', alt: 'Red chilli peppers' },
  chilli:     { file: 'chilli.jpg',     alt: 'Red chilli peppers' },
  chillies:   { file: 'chilli.jpg',     alt: 'Red chilli peppers' },
  chilies:    { file: 'chilli.jpg',     alt: 'Red chilli peppers' },
  coriander:  { file: 'vegetables.jpg', alt: 'Coriander herbs' },
  dhania:     { file: 'vegetables.jpg', alt: 'Coriander herbs' },
  'cummin seed': { file: 'vegetables.jpg', alt: 'Cumin seeds' },
  cumin:      { file: 'vegetables.jpg', alt: 'Cumin seeds' },
  jeera:      { file: 'vegetables.jpg', alt: 'Cumin seeds' },
  methi:      { file: 'vegetables.jpg', alt: 'Fenugreek leaves' },
  fenugreek:  { file: 'vegetables.jpg', alt: 'Fenugreek leaves' },
  saunf:      { file: 'vegetables.jpg', alt: 'Fennel seeds' },
  fennel:     { file: 'vegetables.jpg', alt: 'Fennel seeds' },
  'ginger(dry)': { file: 'turmeric.jpg', alt: 'Dry ginger root' },
  ginger:     { file: 'turmeric.jpg',    alt: 'Ginger root' },
  garlic:     { file: 'onion.jpg',       alt: 'Garlic bulbs' },
  turmeric:   { file: 'turmeric.jpg',    alt: 'Turmeric crop' },
  banana:     { file: 'banana.jpg',      alt: 'Banana bunch' },
  mango:      { file: 'mango.jpg',       alt: 'Mango orchard' },
  grapes:     { file: 'grapes.jpg',      alt: 'Grape vineyard' },
  grape:      { file: 'grapes.jpg',      alt: 'Grape vineyard' },
  coconut:    { file: 'coconut.jpg',     alt: 'Coconut grove' },
  arecanut:   { file: 'coconut.jpg',     alt: 'Arecanut palm' },
  areca:      { file: 'coconut.jpg',     alt: 'Arecanut palm' },
  sugarcane:  { file: 'sugarcane.jpg',   alt: 'Sugarcane field' },
  'sugar cane': { file: 'sugarcane.jpg', alt: 'Sugarcane field' },
  cane:       { file: 'sugarcane.jpg',   alt: 'Sugarcane field' },
  vegetables: { file: 'vegetables.jpg',  alt: 'Fresh vegetables' },
  vegetable:  { file: 'vegetables.jpg',  alt: 'Fresh vegetables' },
    fruits:     { file: 'fruits.jpg',      alt: 'Fresh fruits' },
  fruit:      { file: 'fruits.jpg',      alt: 'Fresh fruits' },
};

/**
 * Crops best represented by a cinematic photo because no dedicated photo
 * exists for them. These files live under public/assets/cinematic/.
 */
const CINEMATIC_CROP_MAP: Record<string, { file: string; alt: string }> = {
  mustard:        { file: 'harvest.jpg',  alt: 'Golden mustard field' },
  coffee:         { file: 'seedling.jpg', alt: 'Coffee plantation' },
  tea:            { file: 'seedling.jpg', alt: 'Tea garden' },
  cardamom:       { file: 'planting.jpg', alt: 'Cardamom plantation' },
  'black pepper': { file: 'planting.jpg', alt: 'Black pepper vines' },
  pepper:         { file: 'planting.jpg', alt: 'Black pepper vines' },
  cloves:         { file: 'planting.jpg', alt: 'Cloves on stem' },
  'castor seed':  { file: 'planting.jpg', alt: 'Castor plantation' },
};

/** Filenames that only exist under public/assets/cinematic/. */
const CINEMATIC_FILES = new Set([
  'field.jpg', 'harvest.jpg', 'meadow.jpg', 'planting.jpg',
  'produce.jpg', 'seedling.jpg', 'sky.jpg', 'storm.jpg',
]);

/**
 * Build an image reference, picking the asset folder that actually holds the
 * file. Without this, cinematic filenames such as `field.jpg` were requested
 * from public/assets/crops/, returned 404, and every affected price card
 * rendered as the same empty gradient band — the identical-images bug.
 */
function resolveAsset(file: string, alt: string): CropImage {
  const base = CINEMATIC_FILES.has(file) ? CINEMATIC_BASE : CROPS_BASE;
  return { src: `${base}/${file}`, alt };
}

/** Cinematic images reused as fallback for unmapped crops. */
const FALLBACK_CINEMATIC = [
  { file: 'field.jpg',    alt: 'Green farm field' },
  { file: 'harvest.jpg',  alt: 'Golden harvest field' },
  { file: 'meadow.jpg',   alt: 'Green meadow' },
  { file: 'planting.jpg', alt: 'Seedlings being planted' },
  { file: 'seedling.jpg', alt: 'Young plantation seedling' },
  { file: 'produce.jpg',  alt: 'Fresh produce' },
];

/**
 * Normalise a crop/commodity string for tolerant matching.
 * Lower-case, strip parentheses, punctuation, and extra whitespace.
 */
function normalizeCropName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable hash so the same crop always maps to the same cinematic fallback. */
function hashToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Resolve any crop/commodity string to a background image.
 *
 * Resolution order:
 * 1. Exact normalised match in CROP_IMAGE_MAP (dedicated crop photo).
 * 2. Exact normalised match in CINEMATIC_CROP_MAP (cinematic photo).
 * 3. Token overlap — if every word in the query appears in a map key.
 * 4. Deterministic cinematic fallback based on hash.
 */
export function getCropImage(commodity: string): CropImage {
  if (!commodity) {
    return resolveAsset('field.jpg', 'Green farm field');
  }

  const norm = normalizeCropName(commodity);
  if (!norm) {
    return resolveAsset('field.jpg', 'Green farm field');
  }

  // 1. Dedicated crop photo
  const cropImg = CROP_IMAGE_MAP[norm];
  if (cropImg) return resolveAsset(cropImg.file, cropImg.alt);

  // 2. Cinematic photo for crops without a dedicated image
  const cinematicImg = CINEMATIC_CROP_MAP[norm];
  if (cinematicImg) return resolveAsset(cinematicImg.file, cinematicImg.alt);

  // 3. Token-overlap: every word of the query must appear in a map key
  const queryWords = norm.split(' ');
  for (const map of [CROP_IMAGE_MAP, CINEMATIC_CROP_MAP]) {
    for (const [key, img] of Object.entries(map)) {
      const keyWords = key.toLowerCase().split(/[\s/]+/);
      if (queryWords.length > 0 && queryWords.every(w => keyWords.includes(w))) {
        return resolveAsset(img.file, img.alt);
      }
    }
  }

  // 4. Deterministic cinematic fallback
  const idx = hashToInt(norm) % FALLBACK_CINEMATIC.length;
  const fb = FALLBACK_CINEMATIC[idx];
  return resolveAsset(fb.file, fb.alt);
}
