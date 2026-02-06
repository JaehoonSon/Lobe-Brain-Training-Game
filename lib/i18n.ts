import de from "../assets/locales/de.json";
import en from "../assets/locales/en.json";
import es from "../assets/locales/es.json";
import fr from "../assets/locales/fr.json";
import hi from "../assets/locales/hi.json";
import ja from "../assets/locales/ja.json";
import ko from "../assets/locales/ko.json";
import ptBR from "../assets/locales/pt-BR.json";
import ptPT from "../assets/locales/pt-PT.json";
import ru from "../assets/locales/ru.json";
import zhCN from "../assets/locales/zh-CN.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n, { LanguageDetectorAsyncModule } from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: en },
  es: { translation: es },
  ko: { translation: ko },
  "zh-Hans": { translation: zhCN },
  ja: { translation: ja },
  "pt-BR": { translation: ptBR },
  "pt-PT": { translation: ptPT },
  de: { translation: de },
  fr: { translation: fr },
  hi: { translation: hi },
  ru: { translation: ru },
};

const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode ?? "en";
  }
  return "en";
};

const LANGUAGE_KEY = "user-language";
const LANGUAGE_MODE_KEY = "user-language-mode";
const LANGUAGE_MODE_SYSTEM = "system";
const LANGUAGE_MODE_CUSTOM = "custom";

export const SYSTEM_LANGUAGE_VALUE = "system";

const readStoredLanguage = async () => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.log("Error reading language", error);
    return null;
  }
};

const readStoredLanguageMode = async () => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_MODE_KEY);
  } catch (error) {
    console.log("Error reading language mode", error);
    return null;
  }
};

const writeStoredLanguage = async (lng: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.log("Error saving language", error);
  }
};

const writeStoredLanguageMode = async (mode: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_MODE_KEY, mode);
  } catch (error) {
    console.log("Error saving language mode", error);
  }
};

const clearStoredLanguage = async () => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
  } catch (error) {
    console.log("Error removing language", error);
  }
};

const resolveLanguagePreference = async () => {
  const [savedLanguage, savedMode] = await Promise.all([
    readStoredLanguage(),
    readStoredLanguageMode(),
  ]);
  const deviceLocale = getDeviceLocale();

  if (savedMode === LANGUAGE_MODE_CUSTOM && savedLanguage) {
    return {
      preference: savedLanguage,
      mode: LANGUAGE_MODE_CUSTOM,
      deviceLocale,
    };
  }

  if (!savedMode && savedLanguage && savedLanguage !== deviceLocale) {
    await writeStoredLanguageMode(LANGUAGE_MODE_CUSTOM);
    return {
      preference: savedLanguage,
      mode: LANGUAGE_MODE_CUSTOM,
      deviceLocale,
    };
  }

  if (!savedMode) {
    await writeStoredLanguageMode(LANGUAGE_MODE_SYSTEM);
  }

  if (savedLanguage && savedLanguage === deviceLocale) {
    await clearStoredLanguage();
  }

  return {
    preference: SYSTEM_LANGUAGE_VALUE,
    mode: LANGUAGE_MODE_SYSTEM,
    deviceLocale,
  };
};

const languageDetector: LanguageDetectorAsyncModule = {
  type: "languageDetector",
  async: true,
  init: () => {},
  detect: async (callback: (lng: string) => void) => {
    const { preference, mode, deviceLocale } =
      await resolveLanguagePreference();
    const resolvedLanguage =
      mode === LANGUAGE_MODE_CUSTOM ? preference : deviceLocale;
    callback(resolvedLanguage);
    return resolvedLanguage;
  },
  cacheUserLanguage: async () => {},
};

i18n
  .use(initReactI18next)
  .use(languageDetector)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const setPreferredLanguage = async (lng: string) => {
  await writeStoredLanguage(lng);
  await writeStoredLanguageMode(LANGUAGE_MODE_CUSTOM);

  await i18n.changeLanguage(lng);
};

export const getPreferredLanguage = async () => {
  const { preference } = await resolveLanguagePreference();
  return preference;
};

export const setSystemLanguage = async () => {
  await clearStoredLanguage();
  await writeStoredLanguageMode(LANGUAGE_MODE_SYSTEM);
  const deviceLocale = getDeviceLocale();
  await i18n.changeLanguage(deviceLocale);
  return deviceLocale;
};

export default i18n;
