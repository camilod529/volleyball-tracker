import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "../../locales/en.json";
import es from "../../locales/es.json";

export type SupportedLanguage = "en" | "es";

/** The app only ships en/es, so any other device locale falls back to English. */
export function getDeviceLanguage(): SupportedLanguage {
  return Localization.getLocales()[0]?.languageCode === "es" ? "es" : "en";
}

const deviceLanguage = getDeviceLanguage();

// eslint-disable-next-line import/no-named-as-default-member -- i18next's documented API is the default-export chain `i18n.use(...).init(...)`
void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
