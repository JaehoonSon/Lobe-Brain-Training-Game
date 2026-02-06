// This file provides type-safe translations for react-i18next
// It reads the structure from en.json and provides autocomplete for t() calls
import resources from "../assets/locales/en.json";
import "i18next";

// Create a type from the English translations
type TranslationResources = typeof resources;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: TranslationResources;
    };
  }
}
