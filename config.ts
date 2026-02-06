import type { ExternalPathString } from "expo-router/build/typed-routes/types";
import i18n from "~/lib/i18n";
import { normalizeLocale } from "~/lib/locale";

interface AppMetadata {
  privacyPolicyUrl: ExternalPathString;
  endUserLicenseAgreementUrl: ExternalPathString;
  termsOfServiceUrl: ExternalPathString;
}

export const BASE_API_ENDPOINT = __DEV__
  ? "http://127.0.0.1:8000"
  : "http://109.199.116.115:8001";
// export const BASE_API_ENDPOINT = "http://127.0.0.1:8000";
// export const BASE_API_ENDPOINT = "http://109.199.116.115:8001";

export const appMetadata: AppMetadata = {
  get privacyPolicyUrl() {
    return `https://lobe.theblucks.com/${normalizeLocale(
      i18n.language,
    )}/privacy` as ExternalPathString;
  },
  get endUserLicenseAgreementUrl() {
    return `https://lobe.theblucks.com/${normalizeLocale(
      i18n.language,
    )}/eula` as ExternalPathString;
  },
  get termsOfServiceUrl() {
    return `https://lobe.theblucks.com/${normalizeLocale(
      i18n.language,
    )}/terms` as ExternalPathString;
  },
};
