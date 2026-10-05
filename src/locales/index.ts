import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { Language } from '../types';

export const translations = {
  en,
  hi,
  mr,
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
