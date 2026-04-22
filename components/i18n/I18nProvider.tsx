"use client";

import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { getStoredLocale, persistLocale } from "@/lib/i18n/client";

function syncDocument(lang: string) {
  const lng = lang === "ar" ? "ar" : "en";
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
  document.documentElement.dir = dir;
  document.body.classList.toggle("locale-rtl", dir === "rtl");
}

function HtmlLangSync() {
  useLayoutEffect(() => {
    const saved = getStoredLocale();
    if (i18n.language !== saved) {
      void i18n.changeLanguage(saved);
    }
    syncDocument(i18n.language);

    const onChange = (lng: string) => {
      persistLocale(lng);
      syncDocument(lng);
    };
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);

  return null;
}

export default function I18nProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <HtmlLangSync />
      {children}
    </I18nextProvider>
  );
}
