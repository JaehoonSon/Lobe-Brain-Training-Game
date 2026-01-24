import i18n, { ThirdPartyModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';
import ko from '../assets/locales/ko.json';
import zhCN from '../assets/locales/zh-CN.json';
import ja from '../assets/locales/ja.json';
import pt from '../assets/locales/pt.json';
import de from '../assets/locales/de.json';
import fr from '../assets/locales/fr.json';
import hi from '../assets/locales/hi.json';
import ru from '../assets/locales/ru.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  ko: { translation: ko },
  zh: { translation: zhCN },
  ja: { translation: ja },
  pt: { translation: pt },
  de: { translation: de },
  fr: { translation: fr },
  hi: { translation: hi },
  ru: { translation: ru },
};

const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode ?? 'en';
  }
  return 'en';
};

const LANGUAGE_KEY = 'user-language';

const languageDetector: any = {
  type: 'languageDetector',
  async: true,
  init: () => { },
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.log('Error reading language', error);
    }
    const deviceLocale = getDeviceLocale();
    callback(deviceLocale);
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetector as any)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
