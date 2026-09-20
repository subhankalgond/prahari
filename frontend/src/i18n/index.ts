import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import hi from './hi';
import kn from './kn';
import mr from './mr';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'मराठी' },
] as const;

const saved = localStorage.getItem('kc_lang');
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    kn: { translation: kn },
    mr: { translation: mr },
  },
  lng: saved || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(code: string): void {
  localStorage.setItem('kc_lang', code);
  void i18n.changeLanguage(code);
  document.documentElement.lang = code;
}
