import type { ExternalPathString } from "expo-router/build/typed-routes/types";

interface AppMetadata {
  privacyPolicyUrl: ExternalPathString;
  endUserLicenseAgreementUrl: ExternalPathString;
}

export const BASE_API_ENDPOINT = __DEV__ ? "http://127.0.0.1:8000" : "http://109.199.116.115:8001" ;
// export const BASE_API_ENDPOINT = "http://127.0.0.1:8000";
// export const BASE_API_ENDPOINT = "http://109.199.116.115:8001";

export const appMetadata: AppMetadata = {
  privacyPolicyUrl:
    "https://theblucks.github.io/Elysia/privacy",
  endUserLicenseAgreementUrl:
    "https://theblucks.github.io/Elysia/eula",
};