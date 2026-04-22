"use client";

import { useTranslation } from "react-i18next";
import styles from "./language-toggle.module.css";

export default function LanguageToggle() {
  const { i18n, t } = useTranslation("common");
  const lng = i18n.language === "ar" ? "ar" : "en";

  return (
    <div className={styles.toggle} aria-label="Language">
      <button
        type="button"
        className={`${styles.link} ${lng === "en" ? styles.active : ""}`}
        onClick={() => void i18n.changeLanguage("en")}
      >
        {t("nav.langEn")}
      </button>
      <span className={styles.separator} aria-hidden>
        |
      </span>
      <button
        type="button"
        className={`${styles.link} ${lng === "ar" ? styles.active : ""}`}
        onClick={() => void i18n.changeLanguage("ar")}
      >
        {t("nav.langAr")}
      </button>
    </div>
  );
}
