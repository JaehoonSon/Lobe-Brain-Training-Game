import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode ?? 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
