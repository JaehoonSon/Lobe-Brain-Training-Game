import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
