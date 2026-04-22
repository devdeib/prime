import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/common.json";
import ar from "@/locales/ar/common.json";

const STORAGE_KEY = "vg-locale";

export function getStoredLocale(): "en" | "ar" {
  if (typeof window === "undefined") return "en";
  const s = localStorage.getItem(STORAGE_KEY);
  return s === "ar" ? "ar" : "en";
}

export function persistLocale(lng: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lng === "ar" ? "ar" : "en");
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { common: en },
      ar: { common: ar },
    },
    lng: typeof window !== "undefined" ? getStoredLocale() : "en",
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
