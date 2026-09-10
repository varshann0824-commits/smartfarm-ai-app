const LANGUAGE_RANGES: Array<{ lang: 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr' | 'en'; pattern: RegExp }> = [
  { lang: 'te', pattern: /[\u0C00-\u0C7F]/ },
  { lang: 'hi', pattern: /[\u0900-\u097F]/ },
  { lang: 'ta', pattern: /[\u0B80-\u0BFF]/ },
  { lang: 'kn', pattern: /[\u0C80-\u0CFF]/ },
  { lang: 'ml', pattern: /[\u0D00-\u0D7F]/ },
  { lang: 'mr', pattern: /[\u0900-\u097F]/ },
  { lang: 'en', pattern: /[a-zA-Z]/ },
];

const DEVANAGARI_HI_WORDS = ['मौसम', 'बाजार', 'फसल', 'मिट्टी', 'योजना', 'बारिश', 'कीमत', 'मंडी', 'सरकार', 'खाद'];
const DEVANAGARI_MR_WORDS = ['हवामान', 'बाजारभाव', 'पीक', 'माती', 'योजना', 'पाऊस', 'भाव', 'शेती', 'खत', 'सरकार'];

export function detectLanguage(text: string): 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'mr' | 'en' {
  if (!text || !text.trim()) return 'en';

  for (const { lang, pattern } of LANGUAGE_RANGES) {
    if (pattern.test(text)) {
      if (lang === 'hi' || lang === 'mr') {
        const isMarathi = DEVANAGARI_MR_WORDS.some(w => text.includes(w));
        const isHindi = DEVANAGARI_HI_WORDS.some(w => text.includes(w));
        if (isMarathi && !isHindi) return 'mr';
        if (isHindi) return 'hi';
        return 'hi';
      }
      return lang;
    }
  }

  return 'en';
}
